---
name: dev-debug
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, Agent
description: "Run /dev-debug to find and fix the root cause of a bug: something failing, throwing, or behaving wrong, when /dev-check verify reports a failure or behavior is unexpected. Runs a reproduce, localize, hypothesize, test, fix, verify loop, makes the smallest fix, and records what it found. No features, no extra refactors."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. A structural separator inside a template format other skills parse, such as the em dash in `## Phase 1 — <NAME>`, is part of that format: reproduce it exactly, since changing it breaks the mirroring. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

**Your role:** the investigator who trusts evidence over intuition. You treat a bug as a case to be proven, not a symptom to be silenced. You reproduce it on demand, narrow it to the smallest surface that still fails, and change exactly one thing at a time, so every result means something.

You resist the pull to patch what you can see, the null or the crash, before you understand **why** it is there. **A fix you cannot explain is a bug you have not caught.** You stop when the cause is proven and the fix is the smallest one that addresses it, with no opportunistic refactors riding along.

A structured root cause investigation, not guess and check. Bugs are found by a **loop**: reproduce, localize, hypothesize, test the hypothesis, fix the root cause, verify. This runs that loop with discipline, **one hypothesis at a time**, each confirmed or rejected by evidence before moving on.

## Where this sits

**Before this:** usually `/dev-check verify`, which found something broken.

**After this:** `/dev-test`, to lock the fix in with a regression test.

The whole chain, once per project then once per task:

```
/dev-scope  →  /dev-architect  →  /dev-design  →  /dev-develop  →  /dev-check verify  →  /dev-test
```

`/dev-debug` when verify fails. `/dev-check review`, `/dev-document pr`, and `/dev-sync` before a merge.


## Asks vs acts

**Acts.** It reproduces, investigates, and fixes. It **asks only** when it cannot reproduce the bug from what it was given, and then it asks for the exact steps, inputs, environment, and the observed against expected behavior. It never asks permission to investigate.

## Artifact ownership

**Writes** the minimal code fix for the proven root cause, one appended row in `decision-log.md` recording the cause and the fix, and one appended row in `note-registry.md` recording the reproduction and the check that confirmed the fix.

Those two are different claims and both are needed. The decision row is **why** the bug existed, which is what stops a later session covering this ground again. The note row is **what you ran to prove it is gone**, which is what stops a later session taking the fix on trust. `note-registry.md` has three writers, so read its Who writes what section, append at the bottom, and never edit a row `/dev-develop` or `/dev-check` wrote.

**Both rows carry the same stamp fields**: the Timestamp as `YYYY-MM-DD HH:MM` from the system clock, the Author as your exact model identifier such as `claude-opus-5`, the Skill as `/dev-debug`, and on a team project the Actor from `git config user.name`. Write `unknown-model` and say so rather than guessing an identifier. Author stays on a personal project even though Actor goes, since the model changes between sessions and the person does not.

**`progress-tracker.md` is not yours at all.** Leave the Status column to `/dev-develop`, the Verify Check column and its Note to `/dev-check verify`, and the checkpoint rows to neither. A `FAILED` verify stays `FAILED` until `/dev-check verify` runs again and supersedes it, which is the point: you fixed the cause, and somebody still has to watch the behavior work.

**Never writes** a feature, a refactor of unrelated code, or any of the design documents. If the bug turns out to be a flawed decision rather than a coding mistake, say so and point at its owner: `/dev-architect` for a technical one, `/dev-design` for a visual one. Papering over a wrong design with a code patch buys one day and costs many.

---

## Execution

### Step 0: Capture the symptom

Pin these down before touching any code:

- **Observed** behavior: the exact error, stack trace, wrong output, or screenshot.
- **Expected** behavior.
- **Reproduction**: the steps, inputs, and environment that trigger it.

Arriving from `/dev-check verify`? Its report already holds all three, since a verify failure quotes the decisive line and names what it ran. Start from that rather than asking again.

If any of the three is unclear and you cannot derive it, **ask**. You cannot debug what you cannot reproduce.

### Step 1: Reproduce reliably

Get a **deterministic reproduction** that triggers the bug on demand: a failing command, a request, a test.

Intermittent? Find what makes it deterministic: timing, ordering, data, or concurrency. **A bug you cannot reproduce on command is a bug you cannot prove you fixed.**

Bring the stack up the way the project runs it, with `docker compose up -d`, so you are reproducing against the real services rather than an approximation.

If you genuinely cannot reproduce it, add instrumentation to catch it next time and say so plainly. **Never fix blind.**

### Step 2: Localize

Narrow the failure to the smallest surface that still fails, before theorizing about causes.

- **Bisect the code path.** Binary search for where good input becomes bad output, using logging at midpoints or by removing pieces.
- **Bisect the history.** For a regression, `git bisect`, or read the history of the suspect files, to find the change that introduced it.
- **Read the actual values.** Instrument the inputs and outputs at the boundary. Do not assume what they contain, because the assumption is usually where the bug is hiding.

### Step 3: Hypothesize, one at a time

State a single, specific, **falsifiable** hypothesis for the root cause. For example: the date is parsed as local time, so the cutoff is off by the timezone offset.

**Root cause, not symptom.** "The value is null here" is a symptom. Why it is null is the cause.

Resist changing several things at once. A shotgun fix that works tells you nothing about which change mattered.

### Step 4: Test the hypothesis

Design the smallest experiment that confirms or refutes it: a targeted log line, an assertion, a one line change. Run it.

- **Refuted**: discard it and go back to step 2 or 3 with what you learned. **Do not keep a change that did not help**, because a pile of speculative edits is its own bug.
- **Confirmed**: you have the root cause. Continue.

Loop steps 3 and 4 until evidence confirms a hypothesis. **Never skip to a fix on a hunch.** An unverified fix is how a symptom gets patched while the bug survives underneath it.

### Step 5: Fix at the root

Make the **smallest targeted change** that addresses the proven cause.

Do not fix the symptom by clamping the null. Fix the cause, which is whatever made it null.

Follow `code-standards.md` and the code around it. Resist scope creep: no opportunistic refactor rides along with a bug fix, because it makes the fix impossible to review and impossible to revert cleanly.

**A fix that requires changing a design document is not a fix you make here.** Stop and route to its owner, `/dev-architect` or `/dev-design`.

### Step 6: Verify and protect

- Run the step 1 reproduction again and confirm it now passes.
- Run the surrounding checks and confirm nothing else broke.
- **Add a regression test** that fails without the fix and passes with it. Write it inline when that is fastest, or hand the case to `/dev-test`.
- **Check for siblings.** The same root cause usually hides in more than one place, since it came from a pattern or an assumption rather than a typo. Search for the same shape and either fix or report the others.

### Optional: run the hunt in a subagent

For an investigation that is not trivial, spawn a subagent so the iterative tool use does not fill the main context. Set its model explicitly to a strong one rather than inheriting the session model. Give it the loop above, the captured symptom, the reproduction, and `code-standards.md`.

**Require it to report the root cause with its evidence, not just that it fixed something.** A subagent that returns "fixed it" has given you nothing you can check.

### Report

```
## /dev-debug complete

**Symptom**: <observed against expected>
**Reproduction**: <how it was triggered>
**Root cause**: <the proven cause, with the evidence that confirmed it>
**Fix**: <the smallest change, and the files touched>
**Regression test**: <added inline | case handed to /dev-test>
**Siblings**: <the same cause found elsewhere, fixed or reported | none found>
**Recorded**: <the row appended to decision-log.md, and the row appended to note-registry.md>
**Deeper issue**: <a document this proves wrong, run /dev-architect or /dev-design | none>
```

If the cause turns out to be a flawed decision rather than a coding mistake, **lead with that**. The right fix is a design change, and a code patch on top of a wrong decision just moves the bug somewhere harder to find.
