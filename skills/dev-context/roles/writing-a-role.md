# Writing a role context

*Read by `/dev-context <role>` when the role has no file, and by a person adding one. This skill is read only, so it reports what is missing and never writes the file itself.*

## Where it goes

A role this project invented gets `.konteksto/roles/<name>.md`, written by a person and committed. `<name>` is the exact word somebody types after `/dev-context`, lowercase, with no spaces.

`/dev-context <role>` resolves in this order and stops at the first hit:

1. `.konteksto/roles/<role>.md`, this project's own file
2. `roles/<role>.md`, the default the skill ships

A project file wins, so a project may sharpen a shipped role for its own way of working without editing an installed skill, and reinstalling the skill set never loses it.

## What it must carry

Four sections, in this order, because a role brief that arrives in a different shape every time is a brief nobody skims correctly.

1. **What this role is for.** One paragraph. What it decides, and what it refuses to decide.
2. **The skills you run.** The exact skill names. Also say what it routes to instead of running.
3. **What you write.** The files and columns it owns. When ownership depends on the skill in its hand, use a table with one row per skill.
4. **What you may never do.** The traps this role actually falls into, each with the action and the file where the rule is defined.

Then **Where you stop**: the conditions that end its turn, and where it leaves the route.

## What it must never carry

**The definition of a rule it does not own.** State the trigger, state the action, name the file, and stop. A rule written out in five places gets edited in one, and the four stale copies are the ones the next session reads. Every stale string found in review of this project so far came from exactly that.

The test is whether a session could act correctly reading only this file. The trigger and the action must be here, because a pointer followed on every task is a pointer nobody follows. The definition and the reasoning do not, because a role that already knows to stop does not need to be convinced again.

## What it may never create

No role file may hand a role more authority than the skills give it. **No downstream role may create upstream intent**: a planner cannot decide what a screen looks like, a builder cannot design, a designer cannot decide scope, a reviewer cannot fix, and a coordinator cannot decide what gets built. A new role sits somewhere in that order too, and its file has to say where.

## If the role also runs in a harness pane

The harness sends its own brief on every dispatch, covering how a worker reports back and whether it pushes. That file is `.konteksto/harness-prompts/<name>.md` and `/dev-harness config` asks for it. The two files are not the same thing and neither replaces the other: the role context is the protocol the role follows anywhere, and the harness brief is the mechanics of one run.
