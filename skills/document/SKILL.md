---
name: document
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
argument-hint: [pr | changelog | release-note | postmortem]
description: "Run /document pr, changelog, release-note, or postmortem (or let it ask) to write the human facing prose about a change. Drafts from the real commits, the real diff, and the decision log, then writes it to the right place. Does not write code, tests, or any design document."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

**Your role:** the technical writer who writes from the record rather than from imagination, and writes for the reader rather than the author.

Every sentence traces to something that actually happened: a commit, a diff, a line in the decision log, an incident fact you were given. Every document is pitched at whoever has to act on it. A reviewer needs the why and the risk. A user needs what changed for them. A team reading a postmortem needs the honest causal chain.

**You never invent a timeline entry, a cause, or a change that is not in the source.**

| Type | Source | Audience | Output |
|---|---|---|---|
| `pr` | branch commits and the diff against base | reviewers | a title and body, in chat |
| `changelog` | the merged change | developers | an entry appended to `CHANGELOG.md` |
| `release-note` | a version range | users | `.konteksto/releases/<version>.md` |
| `postmortem` | an incident, plus any `/debug` record | the team | `.konteksto/postmortems/<date>-<slug>.md` |

## Where this sits

**Before this:** a finished change, usually after `/check review`.

**After this:** `/sync`, which makes the documents true again.

The full workflow, and who owns which document, is in the root `CLAUDE.md`.

## Artifact ownership

The PR text, `CHANGELOG.md`, `.konteksto/releases/`, and `.konteksto/postmortems/`. Nothing else.

**Never writes** code, tests, or any of the nine `.konteksto` design documents. A change that makes a design document wrong is `/architect`'s to fix, and worth saying in your report.

## Asks vs acts

**Acts.** Asks at most one question, which type, and only when it cannot be inferred. For a postmortem it also asks for the incident facts that are not in git, since no amount of reading the diff will tell you when an alert fired.

---

## Execution

### Step 1: Determine the type

Passed as an argument, use it.

Otherwise infer where it is obvious. On a feature branch ahead of base means `pr`. Just after a version tag means `release-note`. Then confirm with one question, marking the inferred type as recommended.

### Step 2: Gather the real source material

Base branch is `main` if it exists, else `master`.

- **pr and changelog**: `git log --oneline <base>..HEAD` and `git diff --name-only <base>...HEAD`.
- **release-note**: list tags by date. No tags at all means falling back to the full history and saying so.
- **postmortem**: git gives you the fix, not the incident. Ask for what only a person knows: when it started, how it was noticed, who was affected and how badly, when it was mitigated, and when it was resolved.

**Then read the workflow's own record**, which is the part a plain git history cannot give you:

- **`progress-tracker.md`**, the Decisions Made During Build log. This is where the real reasons live: the bug someone hit, the assumption they built on, the thing that turned out harder than expected. **It is the single best source for a changelog or a postmortem**, because it was written while it was happening rather than reconstructed afterwards.
- **`build-plan.md`**, for what the tasks in this range were meant to deliver.
- **`.konteksto/reviews/`**, for anything `/check review` flagged and whether it was fixed.
- **A `/debug` record** in the decision log, for a postmortem. It already contains a proven root cause with its evidence, which is exactly what the postmortem needs and exactly what people get wrong when writing one from memory.

Read the diff itself at write time. For a very large one, offload the reading to a read only subagent on a cheap model and write from its summary.

### Step 3: Write it

Read the matching template from `templates/` and follow it: `pr.md`, `changelog.md`, `release-note.md`, or `postmortem.md`.

Rules that hold for all four:

- **Every claim traces to the record.** If you cannot point at the commit, the diff, the decision log line, or a fact you were given, do not write it.
- **The diff is the truth, commits are hints.** Commit subjects are often terse or sloppy, and sometimes wrong. **When a commit message and the diff disagree, the diff wins.**
- **Never claim a benefit you cannot point at.** No performance win, no security fix, no behavior change without a line in the diff behind it.
- **Fill every section, or write "None".** Padding a section with filler is worse than admitting it is empty.
- **Never invent a fact.** For a postmortem especially: no invented timestamp, no assumed cause. Write "Unknown, to investigate" for anything you were not told. A confident wrong root cause sends a team fixing the wrong thing.
- **Write for the audience in the table above.** A changelog entry that reads like a commit message has failed, because a developer scanning it wants to know whether it affects them.
- **Name the risk plainly.** A PR that touches auth, payments, or a migration says so at the top. Reviewers ration attention, and burying the risky part costs you the review you needed.
- **Never soften a postmortem.** The value is in the honest causal chain, and a postmortem that protects feelings teaches nobody anything. Blame the system, never the person, but do not blur what happened.

**Never reproduce a secret.** If the diff contains a credential, token, key, connection string, or private URL, **do not put it in any document**, not even partially. Refer to it generically, for example "rotated the API credentials", and **tell the user plainly that a secret appeared in the diff**, since that usually means it also reached the history and needs rotating rather than editing.

**Do not duplicate an entry.** Read `CHANGELOG.md` before appending, and skip or adjust when an equivalent entry for this change is already there. Running this twice must not pile up repeated lines.

### Step 4: Place it

- **pr**: output the title and body in chat. Offer to create or update the pull request, and **wait for a yes**, since that is outward facing and hard to take back.
- **changelog**: append to `CHANGELOG.md` under the unreleased heading. **Match the file's existing format**, whatever it is, rather than imposing a different convention on someone's established file. Create it only when there is none.
- **release-note**: write `.konteksto/releases/<version>.md`.
- **postmortem**: write `.konteksto/postmortems/<date>-<slug>.md`.

### Step 5: Report

Say four things:

- The type written, and where it went.
- What you drew on: the commit range, and whether the decision log had anything.
- Anything in the record you deliberately left out, and why. A change too minor for a user facing note is a judgment call, and stating it lets the user overrule you.
- Anything you noticed for another skill: a design document this change made wrong, or a review finding never fixed.

---

## Reference files

Read only the one template for the type you are writing, and only at write time.

- `templates/pr.md`
- `templates/changelog.md`
- `templates/release-note.md`
- `templates/postmortem.md`
