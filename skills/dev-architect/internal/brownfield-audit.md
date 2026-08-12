# Architect: auditing an existing codebase

Read this at step 4, and only when step 1 found code this workflow did not generate. Skip it on a fresh project, and on our own scaffold.

---

**Skip this step entirely on a fresh project, and on our own scaffold.** It applies only when step 1 found code that this workflow did not generate. Auditing dependencies `/dev-develop` installed from your own stack decision minutes earlier is pure noise, and it teaches the user to skim these reports.

Existing code is a set of decisions already made, most of them by someone with context you do not have. The job is to surface them and get a ruling, not to quietly modernize.

#### Confirm the project structure

`project-overview.md`'s Project Shape already records whether the user wanted the recommended layout or kept their own. **Read it and confirm that decision still holds**, now that the stack is settled and the real cost of moving folders is visible.

If they change their mind, that section belongs to `/dev-scope`. Say so and route them back rather than editing it here. Do not move any file yourself: `/dev-develop` does that, as a task in the plan.

**The adoption baseline is already settled by the time you get here**, in step 2a, and `internal/adoption-baseline.md` defines it. Do not ask either of its questions again. If the user reopens one, that file holds the answer and the wording.

#### Decide what happens to existing components

Ask directly, because both answers are defensible and the wrong assumption is expensive:

> "There are existing components that no task touches yet. Leave them exactly as they are, or bring them in line with the new standards now?"

1. **Leave them, change one only when a task touches it** (recommended): the plan stays small, nothing unrelated breaks, and the codebase converges gradually. Record this as a rule in `code-standards.md`, so no later session treats an old component as a defect.
2. **Bring them all in line now**: honest, and sometimes right before a large build, but it becomes its own phase in `build-plan.md` with its own tasks, never invisible work folded into a feature.

Whichever is chosen, write it down. An unrecorded answer here produces a build where half the sessions refactor on sight and half do not.

#### Audit the dependencies

Read the lock file and the manifest, then check each dependency's real current state. **Fetch the registry or repository page rather than relying on memory**, because a version you remember as current may be two years stale.

Sort every dependency into one of four groups, and handle each differently:

| Finding | What to do |
| --- | --- |
| **Has a known vulnerability** | Update it. This is not a preference, and it is not deferred to a later phase. |
| **Outdated, still maintained** | Update to the current version. Where the jump crosses a major version, say what breaks and make it its own task. |
| **Archived or unmaintained, with a security fix available** | Update to the fixed version now, and plan the replacement separately. |
| **Archived or unmaintained, with no fix coming** | Propose a replacement. |

**On vulnerabilities.** Run the ecosystem's own audit command and read what it reports. Present each finding with its severity, what the package is used for in this project, and the fixed version. **A vulnerable dependency is not a matter of taste**, so recommend the update plainly rather than offering it as one option among equals. The user can still decline, and if they do, record the decision and the reason in the Accepted risks section of `library-docs.md` so it is a known accepted risk rather than an oversight.

**On proposing a replacement**, it must clear the same bar as any other tool in step 2, and you say which checks it passed:

- It genuinely covers what the current package is used for here. Check the actual usage in the code, not the package description.
- It is actively maintained, with real recent activity.
- Its license works for this project.
- The migration cost is stated honestly, including how many files change.

Never swap a library silently as part of another change. Every replacement is its own task in `build-plan.md`, with the reason recorded in `library-docs.md`.

**Record everything.** Updates and replacements become tasks in `build-plan.md`, and `library-docs.md` carries the version notes and the reasons. A finding that is only mentioned in conversation is a finding that gets lost.

Both of those files are written later, in steps 7 and 8. Hold the findings until then rather than writing early, and carry them forward as a list.

