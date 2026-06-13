---
title: DDD Is Not Dying. Cargo-Cult DDD Is.
slug_title: ddd-cargo-cult-ddd
published: false
description: AI will not kill meaningful domain modeling. It will expose the economic rationale behind ceremonial architecture.
tags: ai, architecture, ddd, engineeringmanagement
canonical_url: https://zenn.dev/teru_m/articles/ddd-bureaucracy-ai
---

This is not an attack on Domain-Driven Design.

The core value of DDD still matters, perhaps even more in the age of AI.

- Understanding a complex business domain
- Defining bounded contexts
- Aligning language between engineers and domain experts
- Discovering invariants
- Making state transitions explicit
- Understanding where change will hurt

These things do not become less important because code generation gets faster.

In fact, they become more important.

AI is powerful, but it does not remove the need for clear boundaries, precise language, explicit constraints, and well-defined behavior. If anything, AI makes the absence of those things more dangerous. When code becomes cheap to generate, the cost of unclear domain thinking becomes more visible.

So the problem is not DDD itself.

The problem is something else: **cargo-cult DDD**.

Or more precisely:

```text
The problem is using tactical DDD as a tool of organizational control.
```

## DDD as Understanding vs DDD as Control

There are two very different uses of architecture.

- Design for understanding
- Design for control

DDD at its best is design for understanding.

It helps a team understand the business. It forces people to clarify language. It separates contexts that should not be mixed. It exposes invariants and state transitions. It makes change more manageable because the model reflects the domain.

That is valuable.

But in many software product organizations, especially as teams grow, tactical DDD often turns into something else.

- Create an Entity.
- Create a Value Object.
- Add a Repository.
- Put the operation in a Use Case.
- Convert the boundary data into a DTO.
- Keep the Controller thin.
- Write a Mapper.
- Follow the existing directory structure.

None of these patterns are inherently bad.

There are good reasons to use entities, value objects, repositories, use cases, DTOs, and mappers.

But the question is not whether the pattern exists.

The question is:

> Does this structure express domain complexity?
> Or does it merely make the organization easier to manage?

That distinction matters.

When tactical DDD is used well, it helps engineers reason about the business.

When tactical DDD is used poorly, it becomes a standardized form-filling exercise. Everyone knows which files to create. Reviewers know which formal rules to enforce. Junior developers can be assigned small mechanical tasks. External vendors can be onboarded more easily. People can leave and be replaced with less disruption.

At that point, architecture is no longer primarily a technical tool.

It becomes a tool of managerial control.

More bluntly:

> It is no longer design for handling complex business domains.
> It is design for making developers interchangeable inside a complex organization.

## When Tactical DDD Becomes Architectural Paperwork

Again, the patterns themselves are not the issue.

A Value Object can be useful if it protects an invariant.

A Repository can be useful if it isolates persistence concerns from the domain.

A Use Case can be useful if it represents a meaningful business operation.

A DTO can be useful if it marks a boundary between contexts, APIs, processes, or trust zones.

In those cases, the pattern has meaning.

But there is another version.

- The Value Object is just a wrapper class.
- The Repository is just a DAO with a different name.
- The Use Case is just a place where the framework told us to put code.
- The DTO is just copied data with no semantic boundary.
- The Mapper only moves fields from one object to another.
- The directory structure looks serious, but the model says very little.

This is not domain modeling.

This is architectural paperwork.

The codebase becomes a set of forms:

- Controller field
- Use Case field
- Repository field
- Boundary payload field
- Mapper field
- Entity field

The developer's job becomes filling in the right boxes.

That may be useful for organizational scaling. It may reduce variation. It may make review easier. It may allow less experienced developers to contribute safely within narrow boundaries.

But we should call it what it is.

It is not necessarily design sophistication.

It is bureaucracy expressed as architecture.

## AI Makes This Kind of Work Much Faster

AI is very good at this form of work.

If a codebase already contains many similar examples, AI can imitate them quickly.

It can generate:

- Request and response objects
- Mappers
- Repository interfaces
- Use Case classes
- Controller changes
- Test scaffolding
- CRUD variations
- Layer-to-layer data shuffling
- Code that follows existing patterns
- Fixes for review comments about structure

This is exactly the kind of work where AI feels immediately useful.

And to be clear, productivity does improve.

A less experienced developer with AI can produce DDD-flavored boilerplate much faster than before. They can follow existing patterns, generate repetitive classes, move data across layers, and respond to formal review comments at high speed.

This is real productivity.

But it is a narrow kind of productivity.

It does not necessarily mean the organization has learned to use AI to improve design. It may only mean that the organization has made its existing paperwork cheaper.

AI does not automatically change the structure of the organization.

If you insert AI into an existing bureaucracy, the first thing it does is accelerate the bureaucracy.

If the existing process creates value, that acceleration is useful.

If the existing process is mostly ceremony, AI accelerates the ceremony.

## The Shallow Conclusion: "AI Will Not Replace Developers"

This is where many organizations will draw the wrong conclusion.

They will introduce AI into their existing process and observe something like this:

- We adopted AI.
- Productivity improved.
- But developers are still needed.
- Therefore, AI will not replace developers.

This sounds reasonable.

But it is often a shallow observation.

A more accurate statement would be:

> They are not observing the limits of AI.
> They are observing the limits of how their organization uses AI.

If AI is only asked to generate request objects, repositories, mappers, use cases, and test scaffolding, then of course humans remain necessary.

But what kind of humans remain necessary?

In a strong organization, the necessary people are those who can:

- Define business boundaries
- Clarify language
- Find invariants
- Design state transitions
- Connect customer value to implementation
- Constrain AI output with tests, types, and specifications
- Own a meaningful part of the system

In a bureaucratic organization, the necessary people are often those who:

- Check whether the expected file exists
- Check whether the Use Case is in the right folder
- Check whether the Repository was used
- Check whether the Mapper follows the existing style
- Check whether the code conforms to the ceremony

That is a very different kind of necessity.

AI did not prove that developers cannot be replaced.

It only proved that this organization has confined AI to work that keeps developers trapped in the existing process.

Or, more sharply:

> AI is not immature.
> The work assigned to AI is immature.

## Generation Cost Goes Down. Meaning-Checking Cost Does Not.

The most important distinction in AI-assisted software development is this:

- Generation cost
- Meaning-checking cost

AI drastically lowers the cost of generating boilerplate.

It can produce layers, classes, interfaces, command objects, query objects, schema classes, adapters, tests, and documentation very quickly.

But the cost of checking semantic correctness does not disappear.

Someone still has to ask:

- Is this Use Case actually a meaningful business operation?
- Does this Entity really have identity?
- Does this Value Object actually protect an invariant?
- Is this Repository a real abstraction, or just a renamed DAO?
- Does this boundary object protect a contract, or is it just data shuffling?
- Does this layer increase changeability, or only increase file count?

The more meaningless structure AI generates, the more humans have to read through it.

So the danger is not that AI will immediately remove ceremonial architecture.

The danger is that AI may make ceremonial architecture cheaper to produce, and therefore more common.

AI pushes the generation cost of ceremony toward zero.

But it does not push the cost of understanding that ceremony toward zero.

Therefore, meaningless ceremony becomes technical debt faster.

That is the central problem.

## AI May Extend Bureaucracy Before It Destroys It

AI does not immediately destroy weak organizations.

At first, it may extend them.

The pattern looks like this:

- AI generates more multi-layered code.
- Humans review more AI-generated code.
- Formal review rules become more important.
- Existing managers and tech leads remain necessary.
- The organization concludes that humans are still essential.

But this does not prove that the human work is high-leverage.

It may only prove that humans are now needed to clean up and supervise the complexity the organization created for itself.

This is the irony.

AI has the potential to reduce waste.

But if the organization is built around waste, AI first makes the waste cheaper.

AI does not first remove the bureaucracy.

It first makes the bureaucracy more affordable.

And when bureaucracy becomes cheaper, organizations often keep it.

## The Real Competition Happens Outside the Organization

The question "Will AI replace developers?" is too narrow.

The more important competition is not always inside the same organization.

It is between different organizational forms.

```text
Large AI-assisted bureaucratic engineering organizations
vs
Small AI-amplified high-ownership teams
```

The first type will see local productivity gains.

- Tickets move faster.
- CRUD work gets done faster.
- Review comments are addressed faster.
- Documentation is generated faster.
- Boundary objects and mappers are added faster.

From the inside, this looks like progress.

But from the outside, the organization may still be slow.

- Too many meetings
- Unclear ownership
- Formal reviews
- Weak executable specifications
- Boundaries based on org charts instead of business domains
- Changes that require touching many layers without changing much meaning

The second type uses AI differently.

Small high-ownership teams use AI to increase their ability to change the system safely.

They focus on:

- Executable specifications
- Strong boundaries
- Automated tests
- Type-level constraints
- Runtime validation
- Explicit state transitions
- Fast feedback loops
- Clear ownership
- Observability in production

For them, AI is not mainly a boilerplate generator.

It is a force multiplier for system ownership.

That difference is huge.

Weak organizations use AI to make existing work faster.

Strong organizations use AI to remove the need for much of that work.

## Remote-Work Resistance Has the Same Root

This pattern is also related to another common organizational behavior: resistance to remote work.

This is not simply a question of whether remote work is good or bad.

The deeper question is:

> What does the organization use as the basis of trust?

Strong engineering organizations tend to trust things like:

- Clear ownership
- Explicit goals
- Reviewable artifacts
- Executable tests
- Written decisions
- Observable production behavior
- Well-defined interfaces
- Documented trade-offs

Bureaucratic organizations tend to trust things like:

- Being in the office
- Being visible
- Attending meetings
- Being available for interruption
- Following the existing process
- Looking busy
- Receiving informal supervision

The first type manages by outcomes and structure.

The second type manages by presence and procedure.

That is why DDD-flavored bureaucracy and anti-remote-work culture often fit together.

Remote work breaks management by presence.

In an office, people are visible. You can see whether someone is at their desk. You can call a meeting. You can interrupt them. You can get a sense that work is happening.

Remote work removes that visibility.

Then the organization must manage through artifacts:

- What is owned by whom?
- What is the definition of done?
- Where is the specification?
- Which test protects the invariant?
- What decision was made?
- What changed?
- What failed in production?

For a strong organization, this is natural.

For a weak organization, this is threatening.

Because the organization was not actually managing outcomes. It was managing the appearance of control.

This is why "communication" becomes the usual complaint.

- Remote work reduces communication.
- Remote work weakens team culture.
- Remote work makes it hard to mentor juniors.
- Remote work makes progress invisible.
- Remote work removes casual conversations.

Some of this can be true.

But often, "communication" is being used to mean something else:

- The ability to interrupt people synchronously
- The ability to compensate for unclear ownership with conversation
- The ability to avoid writing down decisions
- The ability to resolve ambiguity through meetings
- The ability to judge progress by atmosphere instead of artifacts

In that case, remote work is not destroying communication.

It is destroying the organization's ability to operate with ambiguity hidden inside informal interaction.

This is closely related to cargo-cult DDD.

In one case, architecture is used to make code and developers controllable.

In the other case, the office is used to make people visible and controllable.

Architecture becomes an interface for controlling code.

The office becomes an interface for managerial control.

Meetings absorb unclear responsibility.

Reviews enforce formal consistency.

These are not separate phenomena.

They point in the same direction.

- The organization does not trust ownership.
- It cannot manage through artifacts.
- It lacks executable specifications.
- It relies on presence, ceremony, and supervision.

That is why AI and remote work expose similar weaknesses.

AI separates meaningful design from meaningless work.

Remote work separates organizations that manage outcomes from organizations that manage presence.

This does not mean all office work is bad.

There are valid reasons for in-person work: onboarding, hardware, security, crisis response, customer work, sensitive collaboration, and team formation.

The problem is not the office itself.

The problem is using the office as a substitute for ownership, clarity, and trust.

## What Remains Valuable from DDD

DDD is not dying.

What dies is DDD-flavored bureaucracy.

The parts of DDD that remain valuable are the ones that help a team understand and protect domain meaning:

- Business boundaries
- Ubiquitous language
- Bounded contexts
- Invariants
- State transitions
- Ownership of responsibilities
- Executable tests
- Types, constraints, and validation
- A clear view of where change will break things

The parts that lose value are the purely ceremonial rules:

- Use a Repository.
- Put it in a Use Case.
- Convert it to a DTO.
- Keep the Controller thin.
- Follow the directory structure.
- Make it look like the existing code.
- Avoid review comments by following the ritual.

Again, these patterns can be useful.

But their value depends on whether they represent actual domain boundaries, constraints, and responsibilities.

If they express meaning, they remain.

If they only enforce conformity, AI makes their economic value decline.

## What AI-Era Architecture Needs

AI-era architecture should rely less on humans reading every line and more on executable checks.

The premise that humans can semantically review every generated line of code is becoming weaker.

Instead, we need systems where invalid changes fail quickly.

- Invalid states should be impossible or difficult to represent.
- Invalid transitions should be rejected.
- Boundary crossings should include validation.
- Specification violations should fail tests.
- Types should encode constraints where possible.
- Runtime checks should protect what types cannot.
- Change impact should be localized.

This is the shift:

```text
Architecture protected by human review
down to
Architecture protected by tests, types, constraints, contracts, and specifications
```

Without this shift, AI becomes a form-filling assistant.

- AI writes the repeated files.
- AI wires the layers together.
- AI moves logic into the expected place.
- Humans check the ceremony.
- The organization concludes that developers are still necessary.

But that is not the essence of AI-era software development.

The point is not to generate more DDD-shaped code.

The point is to build a system that can safely absorb AI-generated change.

What matters is not ceremony.

What matters is a breakwater for domain meaning:

- Boundaries
- Language
- Invariants
- State transitions
- Executable specifications

A multi-layered architecture without these things is not domain-driven design.

It is managerial residue in the shape of software.

## A Working Thesis

Developers will not disappear overnight.

In many organizations, AI will preserve existing development work for a while.

Less experienced, lower-cost developers will become more productive with AI. They will generate DDD-flavored boilerplate, move data across layers, follow existing templates, and respond to formal review comments much faster.

That will look like a major productivity gain.

And locally, it will be one.

But the deeper shift is elsewhere.

The disruptive part is not:

```text
Junior developers use AI to fill out DDD-shaped architectural forms faster.
```

The disruptive part is:

```text
High-ownership engineers use AI to make the organizational structure itself lighter.
```

That is the real threat to bureaucratic software organizations.

DDD is not dying.

Cargo-cult DDD is.

AI will not kill meaningful domain modeling.

It will kill the economic rationale for using tactical DDD as architectural paperwork.

And before that happens, AI will do something more ironic:

It will make the bureaucracy cheaper.

But cheaper bureaucracy is still bureaucracy.

Eventually, large AI-assisted bureaucratic organizations will compete with small AI-amplified high-ownership teams.

And from the outside, the difference will be obvious.

One group will use AI to produce more ceremony.

The other will use AI to remove the need for it.
