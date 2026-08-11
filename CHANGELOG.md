# Changelog

What changed in these skills, and what it means for a project already using them. Newest first.

Entries describe the effect on someone running the skills, not the edit that produced it.

## [Unreleased]

### Added

- **An interviewing technique for `/dev-scope`**, in `interview.md`, for the case where an idea is too vague to build options from. One question per turn, each carrying a guess at the answer, until the answers stop surprising you. It runs only when the idea is genuinely unclear, since interviewing a clear request reads as stalling.
- **A Source line on every section of `library-docs.md`**, holding the documentation URL and the date it was read, or a plain statement that nobody checked. A remembered gotcha and a verified one used to look identical on the page, and only one of them was safe to build against.
- **An Accepted risks section in `library-docs.md`**, where a knowingly kept vulnerable dependency lands. `/dev-architect` was already told to record one there and the template had nowhere to put it.
- **A Definition of Done section in `code-standards.md`**, a short table of checks with the exact command for each, written once by `/dev-architect`. The bar for stamping a task `DONE` was scattered across two skills as prose before this, which meant every session set it again from memory. It deliberately excludes runtime proof, tests, and human review, since those are other skills' claims and folding them in would have made `DONE` mean four things.
- **A doubt pass in `/dev-architect`**, in `internal/doubt-pass.md`, for the few decisions a later skill cannot cheaply reverse. It sends the decision and what it must satisfy to a fresh reviewer on another model, with its own reasoning stripped out, then sorts the findings and caps at three rounds. Separate from the cross check, which reads a finished document and is always the user's call.

### Changed

- **`/dev-architect` reads the version from the manifest before writing a library note**, then fetches the docs page for that version rather than writing from memory.
- **`/dev-develop` reports the documentation it had to go and read**, with the URL and the version, instead of quietly using it and moving on. It still writes nothing to `library-docs.md`, which stays `/dev-architect`'s file.
- **`/dev-sync` marks its dependency stubs unsourced** when a manifest gains a package, so a placeholder cannot be mistaken for a note somebody verified.
- **`/dev-develop` runs every row of the Definition of Done before stamping `DONE`**, and reports each result. A row it skipped counts as a row that failed.
- **`/dev-sync` says plainly that its own `DONE` stamps are the narrower claim.** It runs nothing, so it cannot confirm the Definition of Done, and a task it stamped from repo evidence is now reported as needing that check rather than passing as finished.

## [0.2.0] — 2026-08-09

### Added

- **`decision-log.md`, an eleventh document.** What was decided during a build, and why, in one append only table. `/dev-develop` and `/dev-debug` write to it, and only when there was something to decide, so a task that goes to plan adds nothing. `/dev-document` reads it for changelogs and postmortems.
- **A Verify Check column in `progress-tracker.md`**, written by `/dev-check verify`. A task now records both that it was built and whether somebody ran it and watched it work. Those were the same tick before, and a task could look finished having never been exercised.
- **An Author column in `decision-log.md` and `note-registry.md`**, holding the exact model identifier that wrote the row. It stays on a personal project even though the Actor column does not, since the model changes between sessions when the person does not.
- **A Note column in `progress-tracker.md`**, on a blocked task or a failing verify only, saying in one line what somebody needs to deal with.
- **Worked example sections** in the `progress-tracker.md`, `decision-log.md`, and `note-registry.md` templates, all three showing the same invented build from their own side. `/dev-architect` deletes them when it writes the real files.

### Changed

- **The Progress section of `progress-tracker.md` is a table per phase**, not a checkbox list. Each task carries its status, its verify result, who it is assigned to on a team project, and a note when something is wrong.
- **Status is one of `PENDING`, `DONE`, or `BLOCKED`**, where before a task was only ticked or unticked. A task stopped on something outside itself now says so instead of looking untouched.
- **Every status and verify result is stamped** with the model that set it and the local time to the minute. A value that changes is struck through and the new one appended after it, so a task that went `DONE`, then `BLOCKED`, then `DONE` again still says so.
- **`progress-tracker.md` has two writers now, split by column.** `/dev-develop` owns everything except Verify Check, which is `/dev-check verify`'s. `/dev-sync` still corrects the first set from repo evidence and never touches the second.
- **`/dev-check verify` records a failed verify** as `FAILED` on the task, with a one line note. It still writes nothing to `note-registry.md` on a failure, because that file holds what was proven.
- **`decision-log.md` entries are rows in a table**, carrying a timestamp to the minute, the actor, the author, the writing skill, and the task. They were dated bullets, which could not be sorted or matched to a task without reading every one.

### Removed

- **The Decisions Made During Build section of `progress-tracker.md`.** It is `decision-log.md` now. An existing project keeps working: move the section into the new file, or leave it where it is and start the new file empty.

## [0.1.0] — 2026-08-07

The first working set. Not tagged, so this records the state of `main` before the above.

### Added

- **Eight skills**, each prefixed `dev-` so a personal skill of the same name cannot shadow it: `/dev-scope`, `/dev-architect`, `/dev-develop`, `/dev-check`, `/dev-debug`, `/dev-test`, `/dev-document`, `/dev-sync`.
- **Ten documents in `.konteksto/`**, written from templates, carrying the reasoning a chat log would have lost.
- **`note-registry.md`**, split out of `progress-tracker.md`, recording what was actually run and what it proved. Three skills append to it, each making a different claim.
- **Team Shape**, asked once by `/dev-scope` and applied by `/dev-architect`: an assignee per task, an actor per note row, and a review checkpoint per phase. Personal projects get none of it.
- **A local installer**, for trying the skills before publishing them.
