# Design: settling the design line

Read this before mapping a single surface, and only when the project has a codebase this workflow did not generate. Skip it on a fresh project, and on a scaffold `/dev-develop` built from a plan.

**This is one half of a pair.** `/dev-architect` asks the other half, the history line, which decides whether features already built appear in `build-plan.md`. The two are separate decisions with separate defaults and separate owners, and each is asked next to the artifact it governs.

---

An existing product is already built and already being used. This workflow arriving late does not make any of that work missing, and treating it as missing is the failure this step exists to prevent: a hundred surfaces stamped `MISSING` and a first build that blocks on a design nobody needs.

**The baseline is the line between what came before and what this workflow governs.** Everything before it is recorded as it is and never re litigated. Everything after it follows the process in full: a new page still needs a prototype, and still needs a person to approve it.

## First, sort what is actually finished

**`BASELINE` means existed and finished before the line, not merely present in the repository.** A half built page, a route behind a flag nobody has turned on, a scaffolded component with a TODO in it: all of those exist, and none of them is baseline.

| What you found | Where it goes |
| --- | --- |
| finished and in use | eligible for `BASELINE`, subject to the question below |
| half built, stubbed, disabled, or abandoned | an ordinary `MISSING` row owing an ordinary design |

**`design-registry.md`'s Status values section defines `BASELINE` and why finished is part of the definition**, along with what puts a baseline surface back into the lifecycle. Read it before writing the first row.

**Where you cannot tell, ask rather than assuming.** From the outside a surface nobody finished looks much like one nobody needed to change, and only the user knows which. **When the answer stays unclear, it is not baseline**, because a `MISSING` row costs a question and a false baseline costs the work nobody now knows is owed.

## The question

> "This codebase already has screens people use. Should the surfaces that already exist get prototypes now, or does the design process start at the next new surface?"

**Ask it against the eligible pile only.** The half built pile is already settled: those surfaces owe designs whatever the answer here is, and offering them as though they were on the table would ask the user to waive work they never had a choice about.

1. **Start at the next new surface** (recommended on anything larger than a few screens): every eligible finished surface gets a row at `BASELINE`, owing no prototype and blocking nothing. Every new surface goes through the full process, prototype and approval included.
2. **Retro design a named few, baseline the rest**: the user names the finished surfaces worth redoing, those go to `MISSING`, and the remaining eligible ones go to `BASELINE`. Good when a handful of screens are already known to be the weak ones.
3. **Retro design everything**: every eligible finished surface goes to `MISSING` too, so nothing is baseline and every surface owes a prototype. Honest, and sometimes right before a large redesign, but say plainly that it is a phase of real work rather than something folded invisibly into the next feature.

**Still map the flows to surfaces.** The baseline changes what a row's status is, not whether the row exists. A product that skips the mapping has no registry at all, and then nobody can tell an existing surface from one nobody has noticed is missing.

## Record it above the Entries table

One line in `design-registry.md`, so a later session can tell a deliberate baseline from a registry somebody never finished. **Use the wording for the option they picked**, because a line claiming every existing surface is baseline is simply false after options 2 and 3, and it is the kind of false nobody rereads.

Option 1:

```
**Adoption baseline:** surfaces finished before <DATE> are recorded at `BASELINE` and owe no prototype. Every surface added after that date follows the full lifecycle.
```

Option 2:

```
**Adoption baseline:** surfaces finished before <DATE> are recorded at `BASELINE` and owe no prototype, except <SURFACES_THE_USER_NAMED>, which are being redesigned and owe one. Every surface added after that date follows the full lifecycle.
```

Option 3:

```
**Adoption baseline:** none. Every surface owes a prototype, including the ones already built.
```

**Write the line even on option 3**, where no row reads `BASELINE`. A registry with nothing to say about a codebase that plainly predates it reads as an oversight, and the next session cannot tell a deliberate answer from a question nobody asked.

## What this does not exempt

Say these plainly when you report the answer, because a user who took the default is usually picturing a wider amnesty than they got:

- **Every new surface still needs its design.** That is the point of the line rather than an exception to it.
- **A baseline surface being recomposed re enters the lifecycle**, and needs a prototype and an approval like any other. `design-registry.md` defines what counts as recomposing.
- **Only what is finished is baseline.** Half built work is an ordinary `MISSING` row.
- **Nothing here is a claim that the existing screens are any good.** `BASELINE` means a surface predates this workflow. It does not mean it was reviewed, accessible, consistent with `design.md`, or approved, and no skill may later read it as though it were.
