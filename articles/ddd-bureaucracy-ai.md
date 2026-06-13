---
title: DDD Isn't Dead. DDD-Shaped Bureaucracy Is.
published: false
tags: ai, architecture, management, ddd
canonical_url: https://zenn.dev/teru_m/articles/ddd-bureaucracy-ai
description: DDD still matters in the AI era, but DDD-shaped bureaucracy is becoming a liability.
---

This is not an article against Domain-Driven Design.

In fact, the core strengths of DDD may become even more important in the AI era:

- understanding complex business domains
- drawing bounded contexts
- building a shared language
- discovering invariants and state transitions
- making the impact of change visible

The faster AI makes code generation, the more important these things become.

If you want AI to work correctly, you cannot simply throw vague business knowledge into a prompt and hope for the best. You need to make boundaries, terminology, constraints, and expected behavior explicit enough for AI to operate on them.

In that sense, the essence of DDD remains valuable.

But the thing often called "DDD" inside software companies and product development organizations is sometimes something very different.

- Create an Entity.
- Create a Value Object.
- Put persistence behind a Repository.
- Put logic in a Use Case.
- Convert everything into a DTO.
- Keep the Controller thin.
- Write a Mapper.

These tactical DDD patterns were supposed to be tools for handling business complexity.

But in many organizations, they become a management technique for making everyone write code in the same shape.

The problem is not DDD.

The problem is a development structure that uses tactical DDD as a tool of organizational control.

In English, the closest phrase may be cargo-cult DDD: imitating the shape of DDD without understanding why the shape is needed.

## Design for Understanding vs Design for Control

There are at least two kinds of design:

- design for understanding
- design for control

The original value of DDD belongs to the first kind.

Understand the business. Align the language. Draw boundaries. Discover invariants. Make state transitions explicit. Make the impact of change visible.

That is design as a tool for understanding the business through software.

But ritualized DDD inside organizations often becomes the second kind.

- Anyone can write code in the same shape.
- Reviewers can make formal comments.
- Tasks are easier to assign to new developers.
- Handover is easier when someone leaves.
- Outsourcing and mass hiring become easier to manage.
- Individual discretion decreases, and developers become more replaceable.

In that case, architecture is not primarily a technical tool. It becomes a means of organizational control.

Put sharply:

> It is no longer design for handling complex business domains.
> It is design for making developers replaceable inside a complex organization.

## When Tactical DDD Becomes a Form

Of course, Repository, DTO, Use Case, and Value Object are not bad by default.

They are useful when they carry real business meaning.

- A Value Object can encapsulate an invariant.
- A Repository can hide persistence details and protect the domain.
- A Use Case can represent a real business operation.
- A DTO can become an explicit contract across a boundary.

In those cases, they are design.

But in reality, many teams end up somewhere else.

- Nobody can explain why the layer is needed.
- The code merely follows the existing directory structure.
- People write code in the shape that avoids review comments.
- Logic is moved from Controller to Use Case because "Controllers must be thin."
- Mappers just copy fields from Entity to DTO.
- Repositories are just DAOs with another name.
- Value Objects are just wrapper classes.

At that point, design is no longer a tool for understanding the business. It becomes a set of blanks to fill in.

You are no longer writing software as much as filling out a typed form:

- Controller field
- Use Case field
- Repository field
- DTO field
- Mapper field
- Entity field

That is not architecture. It is paperwork with types.

## AI Accelerates DDD-Shaped Paperwork

When AI enters this kind of organization, productivity does improve.

That part is real.

The following tasks are very compatible with AI:

- create DTOs
- write Mappers
- define Repository interfaces
- move logic into Use Cases
- keep Controllers thin
- scaffold tests
- convert Entity objects into Responses
- add CRUD features in the style of existing code
- adjust code based on formal review comments

AI can make this work much faster.

Especially when a project already contains many existing patterns, AI is very good at imitating them. If you say, "Add the same thing for this other feature, following the existing implementation," it can generate a large amount of code.

So even bureaucratic DDD organizations will benefit from AI.

Locally, it will be genuinely useful.

But that does not necessarily mean the organization's design capability has improved. It may simply mean that work inside the existing structure has become faster:

- scaffolding
- data conversion between layers
- mechanical glue code
- imitation of existing patterns
- responding to formal review comments

AI does not automatically transform the structure of an organization.

If you introduce AI into an existing structure, the first thing it accelerates is the work that already exists.

If that work creates value, great.

But if that work is ritualized form-filling, AI first accelerates the form-filling.

## "AI Won't Replace Developers" Can Be a Misread

In this kind of organization, AI adoption often settles into this shape:

```text
low-cost, less experienced developers
+ AI
+ DDD-shaped layered templates
+ formal review
```

It is important not to misunderstand this.

This combination can still improve productivity a lot.

Even less experienced developers can produce changes faster with AI. They can expand similar screens, follow an existing layer structure, match naming and directories, scaffold tests, and respond to review comments.

Within that range, AI is very effective.

Then the organization says:

- We adopted AI.
- Productivity improved.
- But we still needed developers.
- Therefore, AI does not replace developers.

This sounds reasonable.

But it is not quite right.

> What you are seeing is not the limit of AI.
> You are seeing the limit of that organization's ability to use AI.

AI did not fail to replace developers.

The organization confined AI inside a workflow where developers cannot be removed.

The work assigned to AI is low-level mechanical work in the first place:

- expand a similar implementation to another screen
- split this logic according to the existing layers
- match the surrounding names and directory structure
- apply only the formal review comments
- align the test names and scaffolds

That is not design.

It is clerical programming.

It is structured form-filling.

If you use AI only within that range and conclude, "See, developers are still necessary," you are not measuring the limit of AI. You are measuring the level of work your organization is capable of delegating to AI.

In shorter words:

> AI is not immature.
> The work given to AI is immature.

## Generation Cost Falls. Meaning-Checking Cost Does Not.

In the AI era, it is crucial to distinguish generation cost from meaning-checking cost.

AI greatly reduces the cost of generating boilerplate:

- Repository
- DTO
- Use Case
- Mapper
- Command
- Query
- Test scaffold

These layers and templates are easy for AI to generate.

But the cost of checking whether the generated multi-layered code is semantically coherent does not fall nearly as much.

In fact, the thinner the meaning of the layers, the more expensive the checking becomes.

Humans still need to ask:

- Is this Use Case really one unit of business operation?
- Does this Entity really have identity?
- Does this Value Object really encapsulate an invariant?
- Is this Repository an abstraction over persistence, or just a DAO?
- Does this DTO conversion protect a boundary, or is it just field-copying?
- Does this layer make change easier, or does it merely increase the number of files?

The more code AI can generate, the heavier this checking becomes.

In other words:

> AI drives the generation cost of rituals toward zero.
> But it does not drive the meaning-checking cost of rituals to zero.
> Therefore, meaningless rituals become liabilities in the AI era.

This is important.

AI will not immediately eliminate thin, meaningless layered structures.

It may temporarily increase them.

Because they become cheap to create.

## AI Temporarily Extends Bureaucracy

AI does not immediately destroy weak organizations.

At first, it may extend their life.

When AI enters an existing bureaucratic process, the following happens:

- AI generates a large amount of layered code.
- Humans review it.
- The volume of formal checking increases.
- The review culture is preserved.
- Existing managers and lead engineers still have work to do.
- People say, "Humans are still necessary."

This does not prove human intellectual value.

It may simply mean that humans are needed to clean up complexity the organization created for itself.

That is the irony.

AI has the potential to reduce unnecessary work. But if an organization is designed around that unnecessary work, AI first makes the unnecessary work faster.

As a result, the wasteful structure may temporarily become stronger.

> AI does not first make waste disappear.
> It first makes waste cheaper.

And once waste becomes cheaper, organizations can preserve it more easily.

## Why These Organizations Often Dislike Remote Work

This is not just about whether an organization is "remote-friendly."

It is about what the organization uses as the basis of trust.

Strong development organizations place trust in things like:

- clear ownership
- executable tests
- written specifications
- reviewable artifacts
- design decisions readable asynchronously
- visible impact of change
- observability in production

Bureaucratic development organizations tend to place trust in things like:

- being in the office
- sitting at a desk
- attending meetings
- being immediately interruptible
- managers being able to see what is happening
- following formal review rules
- not deviating from existing practices

The former manages by outcomes and structure.

The latter manages by presence and procedure.

That is why DDD-shaped bureaucracy and dislike of remote work are highly compatible.

Remote work breaks management by presence.

In an office, people are at least visible. You can see whether someone is at their desk. You can see whether they attend meetings. If someone looks stuck, you can talk to them. Even if progress is vague, you can observe a vague sense of "working."

Remote work removes that.

Then the organization has no choice but to manage through artifacts, ownership, specifications, tests, reviews, documents, and decision logs.

For strong development organizations, that is natural.

- Who owns what?
- What is the definition of done?
- Which specification is authoritative?
- Which tests protect the invariants?
- Which boundaries are affected by this change?

If these are clear, remote work is not a big problem. It may even make asynchronous work easier.

But bureaucratic development organizations are different.

- Ownership is vague.
- Specifications are vague.
- Completion criteria are vague.
- Tests are weak.
- Review standards are formalistic.
- Decisions are trapped in meetings and verbal conversations.
- Boundaries follow the org chart rather than the business domain.

In that state, remote work makes managers anxious.

Because they were not managing outcomes in the first place.

They were managing the appearance that people were manageable.

This is where the word "communication" often appears.

- Remote work reduces communication.
- Remote work weakens team cohesion.
- Remote work makes it harder to train junior developers.
- Remote work removes casual conversations.
- Remote work makes progress invisible.

Some of these are partly true.

But they are not always the essence.

In many cases, what is called "communication" is actually:

- the ability to interrupt synchronously
- the ability to patch vague instructions through speech
- the ability to cover vague responsibility boundaries through conversation
- the ability to avoid recording design decisions
- the ability to sense progress by atmosphere rather than artifacts

In other words:

> Remote work is not breaking communication.
> It is breaking the ability to operate ambiguity while keeping it ambiguous.

This is very similar to DDD-shaped bureaucracy.

DDD-shaped layered architecture may be used not to deepen business understanding, but to make developers more replaceable.

In organizations that dislike remote work, the office may also be less a place for collaboration than a device for making developers manageable.

- Architecture makes code manageable.
- The office makes people manageable.
- Meetings absorb ambiguity in responsibility.
- Reviews preserve formal uniformity.

These four point in the same direction.

It is not a structure where a small number of high-ownership developers autonomously create value.

It is a structure where replaceable developers are managed through forms and places.

That is why AI adoption and remote work get distorted in similar ways.

AI is used not to amplify design capability, but to accelerate DDD-shaped paperwork.

Remote work is treated not as a way to produce outcomes asynchronously, but as a dangerous state where workers are invisible to managers.

The root is the same:

- the organization does not trust ownership
- it cannot manage through artifacts
- it lacks verifiable specifications
- it is weak at asynchronous decision-making
- it treats people as replaceable operators

In that structure, the office is not merely a place to work.

It becomes an interface for managerial control.

Or, to put it differently:

> The reason an organization dislikes remote work is not always that it believes in the value of the office.
> Sometimes it lacks a way to manage by outcomes, so it has no choice but to manage by presence.

Of course, not every in-office policy is bad.

Onboarding, confidential information, hardware work, customer support, emergency response, and team formation can all benefit from face-to-face work.

The problem is when an organization cannot explain the concrete need for being in the office and simply says, "Being in the office matters."

In that case, the office is not being used for collaboration.

It is being used to reduce managerial anxiety.

And organizations like that often draw similar conclusions about AI:

- AI is useful, but humans are still necessary.
- Remote work is useful, but the office is still necessary.

Both statements are true within some range.

But more accurately:

- Human paperwork remains because AI is not being used to amplify design capability.
- Office visibility remains necessary because the organization cannot manage through outcomes and ownership.

AI and remote work both expose organizational weaknesses.

> AI separates meaningless work from meaningful design.
> Remote work separates organizations that can manage by outcomes from organizations that manage by presence.

So it is natural that organizations fond of DDD-shaped bureaucracy often dislike remote work.

Both are reactions to the same anxiety:

- they cannot trust developers
- they cannot delegate ownership
- they cannot judge by artifacts
- they cannot verify through structure
- so they manage through forms and places

In that sense, return-to-office and DDD-shaped bureaucracy are closely related phenomena.

One is control in code.

The other is control in work style.

Both are a poor fit for small, high-ownership teams.

## The Real Competition Happens Outside the Organization

The question "Will AI make developers unnecessary?" is too rough.

The more important question is not whether people inside the same organization are replaced by AI.

The real competition happens outside the organization:

```text
large bureaucratic development organizations assisted by AI
vs
small high-ownership teams amplified by AI
```

That is the real fight.

The former may look more productive internally:

- tickets are closed faster
- CRUD implementation becomes faster
- review comments are addressed faster
- documentation is produced faster
- DTOs and Mappers are added faster

But from the outside, they are still heavy.

- too many meetings
- unclear ownership
- formalistic reviews
- specifications are not executable
- boundaries are drawn by org chart, not business domain
- every change crosses too many layers

Small teams with strong ownership use AI differently.

- They make specifications executable.
- They isolate change by boundary.
- They lock invariants with tests.
- They make invalid states unrepresentable with types.
- They make state transitions explicit.
- They use AI to move broadly inside a small ownership area.
- They improve verification and change speed, not just code generation.

In this setting, AI is not a helper for paperwork.

It is an amplifier of system-changing capability.

The difference is large.

> Weak organizations use AI to make existing work faster.
> Strong organizations use AI to remove existing work.

## What Remains of DDD in the AI Era

DDD is not dead.

What dies is bureaucracy wearing the name of DDD.

What remains in the AI era is:

- business boundaries
- ubiquitous language
- invariants
- state transitions
- ownership of responsibility
- executable tests
- types, constraints, and verification
- visibility into what will break when something changes

What loses value is:

- "Go through the Repository."
- "Convert it into a DTO."
- "Put it in the Use Case."
- "Keep the Controller thin."
- "Follow the existing directory structure."
- "Write it in a shape that avoids review comments."

Again, these patterns are not always unnecessary.

Sometimes you need a Repository.

Sometimes you need a DTO.

Sometimes a Use Case layer is useful.

The question is whether the pattern represents business complexity or merely organizational reassurance.

If it has meaning as design, it remains.

If it only has meaning as organizational control, AI lowers its value.

## We Need Breakwaters, Not Rituals

In the AI era, the important thing is not that humans read every line.

That is becoming less realistic.

The important thing is that when AI makes a change, breakage is detected immediately.

- invalid states cannot be created
- invalid transitions cannot pass
- boundaries validate and transform data explicitly
- specifications fail tests when violated
- types make illegal values unrepresentable
- the impact of change is limited

We need to move from design protected by human review to design protected by tests, types, constraints, and executable specifications.

```text
design protected by human review
↓
design protected by tests, types, constraints, and specifications
```

Organizations that cannot make this transition will use AI as a form-filling clerk.

- AI creates DTOs.
- AI writes Mappers.
- AI moves logic into Use Cases.
- Humans check the result.
- Then people say, "AI is useful, but developers are still necessary."

But that is not the essence of the AI era.

What we need is not DDD ritual.

We need business-meaning breakwaters that safely receive AI-generated change:

- boundaries
- language
- invariants
- state transitions
- verifiable specifications

A multi-layered architecture without these things is merely the remains of organizational control.

## My Current View

Developers will not disappear immediately.

In fact, in many organizations, AI will preserve developer work for a while.

But preservation does not necessarily mean strength.

Less experienced, lower-cost developers can use AI to generate DDD-shaped scaffolding and move data between layers. Local productivity may improve dramatically.

So the organization says:

"AI does not replace developers. It is useful, but not enough."

That observation is shallow.

What they are seeing is not the limit of AI.

They are seeing the limit of an organization that can only use AI for low-level mechanical work.

The disruptive thing is not that less experienced developers can do DDD-shaped paperwork faster with AI.

The disruptive thing is that high-ownership developers can use AI to make the organizational structure itself lighter.

DDD is not dead.

DDD-shaped bureaucracy is dying.

The first thing AI does is not complete replacement of developers.

It extends the life of wasteful organizational structures.

But those extended organizations will lose from the outside to small, high-ownership teams amplified by AI.
