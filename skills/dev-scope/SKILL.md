---
name: dev-scope
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent, AskUserQuestion
description: "Run /dev-scope to start a project. Checks the root folder for an existing codebase, then turns the idea into .konteksto/project-overview.md: what the product is, who it is for, its pages, its flows, and what is deliberately out of scope. Also writes .konteksto/glossary.md, the project's own word for each thing in its domain. Owns those two files and nothing else. Stays tool agnostic; /dev-architect picks the stack."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

The front door of the workflow, and the answer to one question: **what is being built, and for whom.**

Surveys the project root, then fills `.konteksto/project-overview.md` from `templates/project-overview.md` in this skill's own folder, then stops.

It does not answer how. Stack, structure, conventions, tooling, and the build order all belong to `/dev-architect`, and every one of those documents reads this file as its input.

## Where this sits

**Before this:** nothing. This is the front door.

**After this:** `/dev-architect`, which designs how it gets built.

The whole chain, once per project then once per task:

```
/dev-scope  →  /dev-architect  →  /dev-develop  →  /dev-check verify  →  /dev-test
```

`/dev-debug` when verify fails. `/dev-check review`, `/dev-document pr`, and `/dev-sync` before a merge. One rule matters here: **`/dev-scope` owns the what and stays tool agnostic. `/dev-architect` owns the how and makes every tool call.**


## Artifact ownership

Two files, both filled from a template in `templates/`, in this skill's own folder.

- **`.konteksto/project-overview.md`**, created and updated by this skill only.
- **`.konteksto/glossary.md`**, created here and **shared with `/dev-architect`**, which may add a term the design forced into existence and sharpen a definition the schema proved imprecise. It may not rename a term you recorded. Everything else reads the file and writes nothing.

The glossary is the project's own words: what each thing in the domain is called, and which words are rejected for it. It is the one place the product, the documents, and the code agree on a name, and its Who writes what section states the split from its own side as well.

Writes nothing else. Not `architecture.md`, not `build-plan.md`, not code, not config. If the conversation surfaces something that belongs in another document, note it in your closing report for `/dev-architect` to pick up, and leave the file alone.

## Guardrails

**Never name a tool.** No framework, library, database, ORM, host, provider, or package appears in this file or in any question you ask. That is `/dev-architect`'s job, and a scope that names tools rots the moment one is swapped.

Say "stores the user's saved items", not "stores them in Postgres". Say "sends a confirmation to the user", not "sends it with Resend".

If the user names a tool themselves, that is fine and worth remembering. Record it in your closing report as a constraint for `/dev-architect`, not in this file.

**Never guess.** Every value in the file is stated by the user, read from an existing codebase, or picked by the user from options you presented.

**Never write code, scaffold a project, or install anything.**

## Asks vs acts

Sort every question before you ask it.

- **INFER**: anything the idea or the existing codebase already shows. The product category, the obvious pages, the platform. Derive it, then confirm it in one line. Do not ask.
- **ASK**: only what the user alone knows. The real problem, the audience, the business rules, what is deliberately out of scope, what "done" means for this pass.
- **RECOMMEND**: anything your judgment settles. A sensible page set, a navigation shape, a first pass at what should be out of scope. Make the call, give a one line why, let them override.

Never present a neutral menu with no recommendation, and never bundle the whole product into one accept or change question.

## Decision panels

Every user facing choice is an options panel: 2 to 4 concrete options real to this product, exactly one marked as recommended with a one line why. Use `AskUserQuestion` where available, otherwise ask the same options as plain text. The picker adds its own free text option, so only add one yourself in the plain text fallback.

Ask in small rounds, up to 4 related questions per round. Do not fire one question at a time when four related ones could be answered together, and do not dump twenty at once.

**One exception, and it is narrow.** Rounds work because you can already name the options, so the answer to one question does not change what the others are. When the idea is still vague enough that you cannot name them, read `interview.md` in this skill's folder and follow it: one question per turn, each carrying your guess, until you can build a real panel again. Then come back here.

## Execution

### Step 1: Survey the project root

List the project root. Look for source folders, a package manifest (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, or similar), config files, and a git history.

**Check `.konteksto/` before you judge what you are looking at.** Source files and a manifest do not by themselves mean an existing codebase, because this workflow scaffolds a project itself, as the first task in the plan.

- **No code, and no `.konteksto/`.** A genuinely fresh project.
- **Code exists, and `.konteksto/` documents describe it.** This is **our own scaffold**, not somebody else's codebase. Treat it as the fresh project it is. Never re survey it as though it arrived from outside, and never ask the user to describe an app this workflow just generated.
- **Code exists with no `.konteksto/`, or code that does not match what those documents describe.** A real existing codebase. Read its routes, entry points, and user facing strings. Draft the pages, the navigation, and the flows from what is actually there, then ask the user to correct you. Never ask someone to describe an app they already built.

Getting this backwards is expensive in both directions: treating a real codebase as greenfield throws away everything it already decided, and treating our own scaffold as brownfield sends the next skill auditing dependencies it installed ten minutes ago.

Also check `.konteksto/`. If `project-overview.md` already exists, do not overwrite it silently: show what it says and ask whether to update it in place or start over. If the other documents exist too, say so, and note that changing the overview may make them stale.

Carry what you learn here into your closing report, so `/dev-architect` does not survey the same ground again.

### Step 2: Get the idea

If no idea was given and no argument was passed, stop and ask before anything else:

"What are you building? Describe the product in one or two sentences: what it does, and who it is for."

Wait for the answer.

**Then judge whether it is enough to work from.** State your understanding in one sentence with a confidence number from 0 to 100, so the user sees what you took from what they said.

- **Confident, and the answer named a real problem and a real user.** Go to step 3.
- **Not confident, or the answer leaned on convention rather than specifics**, meaning phrases like "the usual dashboard" or "standard auth" that mean something different to everybody. Read `interview.md` in this skill's folder and follow it before step 3.

Do not interview a clear request. It reads as stalling, and `interview.md` says when to skip.

### Step 3: Work through the template, section by section

Read `templates/project-overview.md`, in this skill's folder, in full before writing anything. Then fill it in this order, because each section narrows the next:

1. **About the Project** and **The Problem it Solves.** What it is, and what existing options fail at. Get this in plain language a stranger could act on. If the answer is vague, push once: a scope built on a fuzzy problem produces a fuzzy build plan.
2. **Target Audience.** Who this is for. Shapes which edge cases matter later.
3. **Pages.** One line per route, in the template's exact shape. Recommend a page set from the idea, then let the user cut or add.
4. **Navigation.** The top level shape, so no page invents its own later.
5. **Core User Flow.** One subsection per page, ordered steps in plain language. This is the contract `/dev-architect`'s build plan checks itself against, so it must describe real user actions, not screens.
6. **Features in Scope** and **Features out of Scope.** The fixed list this pass commits to, and the explicit non goals. Be generous with the out of scope list. Every item written there is a feature a later session will not quietly build.
7. **Team Shape.** Personal or team, and whether phases get checkpoints. Two questions, in step 4.
8. **Project Shape.** Which halves exist, and the folder layout. See step 5, which is long enough to stand on its own.

Replace every bracketed placeholder with real content. A finished file contains no literal `<TOKEN>` text. Check this before you present it.

Follow the template's repeat instructions. One line per route, one flow subsection per page, one bullet per feature. Produce as many as the product needs, not one example.

### Step 3a: Write the glossary

Do this once the pages, the flows, and the feature lists exist, because those are where the product's own words show up. Read `templates/glossary.md` in full, then write `.konteksto/glossary.md`.

**Take the terms from what the user actually said.** Their word wins wherever it works, since the glossary's job is to make the documents match the conversation rather than to improve on it. Where two of their words mean one thing, pick one, put the other on the Avoid line, and say you did.

**Two things to look for while writing it, and both come out of the conversation you just had.**

- **One word covering two concepts.** `account` meaning the paying organization in one sentence and the person logging in in the next. That is two entries with two words, and choosing them is the user's call, not yours.
- **A concept with no word at all**, described a different way each time it comes up. Name it. A thing that gets described rather than named gets built twice.

Both of these are what `interview.md` calls sharpening fuzzy language, so when the interview already ran, you have most of this written down.

**The Avoid line is the point of an entry.** A definition on its own stops nobody, because the person about to type `client` is not wondering what `customer` means. Their word appearing on a reject list is what stops them.

**Never put an implementation word in it.** No table, no type, no field, no endpoint, no library. The guardrail at the top of this file applies here in full, and the template's What does not belong here section says the rest.

**Delete the Worked example section.** It is marked Reference only and its terms are invented. Read it for the shape, then leave it out of the file you write, because invented terms in a real glossary are worse than no glossary: everything downstream treats this file as the settled answer.

An honest short glossary beats a padded one. Six terms the user genuinely uses is a working glossary, and twenty terms you inferred is a document nobody trusts.

### Step 4: Settle the team shape

Two questions. Both describe how the work happens rather than what gets built, and neither names a tool, so both belong here.

#### Personal or team

Ask whether this is a personal project or a team one. Recommend from what the root survey showed: several distinct authors in `git log` means team, a single author or no history means personal. Say which signal you used, since a solo developer on a shared repository will want to correct you.

Say plainly what the answer changes, because it is not obvious from the question: on **team**, `/dev-architect` gives every task in `progress-tracker.md` an assignee and every row in `note-registry.md` an actor, so the plan records who owns a task and the log records who ran each check. On **personal**, both are left out, since there is only ever one answer and a column with one value in it is noise.

**Say what this does not do.** It records who owns a task; it does not reserve one. Nothing in this workflow can stop two people building the same task at once, because these are instructions an agent reads, not a server holding a lock. If the user needs a real guarantee, that is branch protection or an issue tracker, and it belongs in their setup rather than in these documents. Promising a lock the system cannot deliver is worse than not offering one.

#### Phase checkpoints

Ask whether each phase should end with a checkpoint, meaning a point where someone other than the builder confirms the phase is sound before the project leans on it. Recommend **yes** for a team, since the value is a second pair of eyes and a solo project has none to offer, and **no** for a personal project.

Say what a checkpoint is and is not:

- It records **what a reviewer must confirm** for that phase. `/dev-architect` writes those criteria into `build-plan.md`.
- It **does not write tests.** `/dev-test` owns every test file, and a checkpoint that wrote its own would make a second writer on them. A checkpoint names what needs covering and routes to `/dev-test`.
- It is **non blocking.** The next phase may start with a checkpoint still unapproved. It is a flag, not a gate. Confirm the user wants it this way, since people often assume a checkpoint stops the line, and one that does not stop the line is a different thing from what they pictured.

Record both answers in the Team Shape section. Nothing else in this file changes because of them.

### Step 5: Settle the project shape

Two questions, in this order. Both describe what is being built, so both belong here. Neither one names a tool.

#### Which halves exist

Ask whether the project is frontend only, backend only, or both. Recommend the answer the flows in step 3 imply, and say why. A product whose flows are all screens with no stored state is frontend only. A product that is an API other systems call is backend only. Most products with saved data are both.

This answer decides which folders exist, so settle it before showing a layout.

#### The folder layout

The recommended layout is:

```
.
└── /
    ├── backend/
    ├── app/
    ├── other-folders/
    └── docker-compose.yml
```

Server code lives in `backend/`, client code lives in `app/`, and the local development stack lives in `docker-compose.yml` at the root. Drop the half that is out of scope. Replace `other-folders/` with the real top level folders this product needs, each with a one line note on what it holds.

Note that `app/` is the client folder, not `frontend/`. Say the name out loud when you present it, because it is the one part of this layout that surprises people.

**Empty folder.** Present the layout as a recommendation and get a yes or no.

**Existing codebase that already matches.** Say so and move on. Change nothing.

**Existing codebase that does not match.** Show the two trees side by side, the real one and the recommended one, and name exactly which folders would move. Then offer three options:

1. **Reshape to the recommended layout** (recommended when the difference is small and the project is early): the moves happen later, during the build, not now.
2. **Keep the current layout**: record the real tree in Project Shape instead, with the reason.
3. **Reshape part of it**: name which folders move and which stay.

**The user can always decline.** A no is a complete answer and needs no justification. Record the layout they chose, mark it as custom, and never raise the recommendation again in a later session. A project that keeps its own structure is not a project with a problem to fix.

Whatever is chosen, write it into the Project Shape section as the real tree, not the recommended one.

Do not create any folder, move any file, or write `docker-compose.yml`. This step records a decision. `/dev-architect` writes the compose file once the stack is known, and `/dev-develop` moves the files.

### Step 6: Present and get approval

Show both finished files. Call out plainly:

- Anything you recommended rather than were told, so the user can push back on your judgment and not only on your transcription.
- Anything that came up and was deliberately left out.
- **Every glossary entry where you picked between the user's own words**, with the word you rejected. This is the one part they are most likely to want changed and least likely to notice on their own, since a rejected word only becomes visible once somebody tries to use it.

Get approval before you finish. If the user changes something, edit the file in place.

### Step 7: Hand off

Report:

- That `.konteksto/project-overview.md` and `.konteksto/glossary.md` are written and approved.
- **The glossary's terms, and any concept you could not name.** `/dev-architect` writes every table, boundary, and component name from these words, and it is the other writer on that file, so say which terms are settled and which the design still has to sharpen.
- What the root survey found: whether a codebase exists, and what it showed.
- The team shape: personal or team, and whether phase checkpoints are on. `/dev-architect` shapes `progress-tracker.md`, `note-registry.md`, and `build-plan.md` from these two answers, so say them explicitly rather than leaving them to be read back out of the file.
- The project shape: which halves exist, and whether the layout is the recommended one or a custom one. `/dev-architect` needs both to write the compose file and the folder tree.
- Any tool, provider, or constraint the user named during the conversation. This is the only place those belong.
- Any question that came up which is a how question, not a what question, so `/dev-architect` starts with it.
- Whether you ran the interview in `interview.md`, and if you did, which assumption it overturned. A first answer the user later corrected is worth passing on, since `/dev-architect` will otherwise rediscover the same wrong idea from the same starting point.
- That you wrote nothing else.

Then name the next step: run `/dev-architect` to design the stack and the build.
