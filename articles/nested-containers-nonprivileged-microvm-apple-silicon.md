---
title: Running a container inside a non-privileged microVM, on an Apple Silicon Mac
slug_title: nested-containers-nonprivileged-microvm-apple-silicon
devto_id: 3902392
published: false
description: To run untrusted AI-agent code safely you need a real VM boundary. To run its tests you need Docker inside that VM. Without privileged. Here is the recipe that works — and the 12 errors behind it — reproduced locally on an M5.
tags: containers, kubernetes, docker, security
---

If you let an AI agent run arbitrary code — `npm install`, a test suite, `docker build`, a Playwright
run — you are running **untrusted code**, and a shared-kernel container is not a boundary against it.
The boundary you want for "tenant A's agent must not reach tenant B" is a **VM**, per run. Kata
Containers gives you that: a pod that is transparently a microVM with its own kernel.

But the verify stage wants to **run containers** (Testcontainers, `docker build`, a DB container). So
you need **nested containers inside the microVM** — and the usual way, `privileged: true`, is the one
thing you must not do, because privileged makes Kata hot-plug **host devices** into the guest, which
is exactly the isolation hole the VM was supposed to close.

So: nested containers, inside a microVM, with `privileged: false`. Here is the recipe that works. I
reproduced the whole thing **locally on an Apple M5**, because M3+ Macs quietly grew nested
virtualization — your laptop can now run a KVM-accelerated microVM that runs Docker.

## The recipe (this is the part that works)

**The stack:**

| Layer | Choice |
| --- | --- |
| Host virt (dev) | Apple M3+/macOS 15+, Lima `vmType: vz` + `nestedVirtualization: true` → real `/dev/kvm` in the guest |
| Hypervisor | Kata + **Cloud Hypervisor** (QEMU hangs on nested virt) |
| Snapshotter | **devmapper on a real block device** (loopback / overlayfs both break) |
| Pod privilege | **NON-privileged + caps**: `SYS_ADMIN, SYS_RESOURCE, NET_ADMIN, MKNOD, SETUID, SETGID, SYS_CHROOT, NET_RAW, SYS_PTRACE` + `resources.limits` |
| OCI runtime | **crun** (runc fails cgroup2 init) |
| Engine | **podman**, `--cgroup-manager=cgroupfs --storage-driver=vfs` |

**The in-box bootstrap** (run before launching any container):

```sh
mount -o remount,rw /sys/fs/cgroup
# cgroup2 won't let you enable controllers in a cgroup that has processes,
# so evacuate everything to /init first, then delegate down, and give containers /pod.
mkdir -p /sys/fs/cgroup/init /sys/fs/cgroup/pod
for p in $(cat /sys/fs/cgroup/cgroup.procs); do echo $p > /sys/fs/cgroup/init/cgroup.procs 2>/dev/null||true; done
echo "+cpu +io +memory +pids" > /sys/fs/cgroup/cgroup.subtree_control
mount -o remount,rw /proc/sys; echo 1 > /proc/sys/net/ipv4/ip_forward

podman --cgroup-manager=cgroupfs --storage-driver=vfs \
       run --cgroup-parent=/pod --network=none --rm hello-world
```

**The payoff:**

```
DELEG=[cpu io memory pids]
=== podman run hello-world ===
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

A container, running inside a **non-privileged Kata microVM**, on a Mac. No `privileged: true`. No
host devices in the guest. The VM is still the only trust boundary — and granting generous caps
*inside* the VM is fine precisely because the VM, not the container, is the boundary.

For context, the microVM itself is real and KVM-accelerated. On M5 / macOS 26 a plain Kata pod boots
with its own kernel:

```
HOST(VM) kernel: 6.8.0-117-generic
POD     kernel: 6.18.28
```

The "you need bare metal for Kata on arm64" advice you'll find is simply out of date for M3+.

## The 12 errors behind that recipe

Nothing above was obvious. Each fix only revealed the next wall. In the order you hit them:

1. **QEMU hangs on nested virt** — `exiting QMP loop, command cancelled`. Switch the Kata hypervisor
   to **Cloud Hypervisor** (or Firecracker).
2. **Loopback devmapper + clh** — `Failed to get Write lock for disk image: already locked`. Use a
   **real block device** for the thin-pool.
3. **`privileged: true` → host-device passthrough.** Privileged makes Kata hot-plug host block devices
   (`/dev/loop0`, `/dev/dm-0`) → `Failed to parse disk image format`. `privileged_without_host_devices`
   did **not** suppress it on clh. Use **caps, not privileged**.
4. **overlayfs snapshotter mis-detects the rootfs as a block device** (the CVE-2026-24054 class; worst
   with images that declare a `VOLUME`, like `docker:dind`). Use **devmapper**.
5. **cgroup2 is read-only** — `mkdir /sys/fs/cgroup/docker: read-only file system`. With `SYS_ADMIN`,
   `mount -o remount,rw /sys/fs/cgroup`.
6. **cgroup2's "no internal process" rule** — `subtree_control` write rejected. Evacuate processes to
   `/init` first, then delegate.
7. **The `io` controller isn't delegated** to the pod. Add `resources.limits` so k8s/Kata delegates it.
8. **runc** → `can't get final child's PID from pipe: EOF`. Use **crun**.
9. **crun wants systemd's sd-bus** → `cannot open sd-bus`. `--cgroup-manager=cgroupfs`.
10. **`oom_score_adj: Permission denied`** → add **`SYS_RESOURCE`**.
11. **fuse-overlayfs: `/dev/fuse` not found** → `--storage-driver=vfs`.
12. **netavark: `set sysctl ... read-only`** → `--network=none` (the engine pulls images on the box's
    own network; the container itself often needs none).

## Honest footnotes

- Errors 3–12 are **not Mac-specific** — they happen the same way on x86 production nodes; the laptop
  just reproduces the real constraint faithfully. Only the host-virt layer (1–2) is dev-only.
- `vfs` storage is for the proof, not production. Real workers want overlay2 on the devmapper-backed
  rootfs.
- The cleaner long-term shape is a **systemd-init box image**: systemd owns the cgroup2 delegation the
  bootstrap above does by hand. It boots in the microVM once you remount cgroup rw before
  `exec /sbin/init`.

The lesson I keep relearning: **"run the tests in an isolated environment" is a one-line requirement
hiding a two-week integration.** The isolation boundary and the thing you run inside it fight each
other, and every layer — hypervisor, snapshotter, privilege model, cgroup delegation, OCI runtime,
storage driver, network — has an opinion. Now you have the map.
