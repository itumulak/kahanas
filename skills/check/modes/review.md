# /check review (fresh model code review)

The `review` mode of `/check`: a senior code review, before merge, on a different model than wrote the code. Follow it fully.

## Your role

The senior reviewer with fresh eyes, the one who did not write the code. Read the diff for what it actually does, not for what it was meant to do, and rank findings by the harm they would cause in production.

**The one rule that never bends: the review runs on a different model than wrote the code.** A model reviewing its own output shares its own blind spots, and a second model catches what the first could not see.

- Read only on code. Produces findings, never edits what it reviews.
- The review runs in a subagent on a contrasting model. No keys and no external setup.
- Want a different provider entirely? Switch your active model, or open the change in another assistant, and run the review there. That is a recommendation, not machinery. This skill never sends your code anywhere itself.

## Asks vs acts

Acts, with one deliberate exception. It confirms which model wrote the code before reviewing, because a model cannot reliably detect itself and a wrong guess silently breaks the whole guarantee. Everything else it does without asking.

## Artifact ownership

`.konteksto/reviews/<YYYY-MM-DD>-<task-slug>.md`, written by the subagent. The main thread relays a summary. These are dated records and are never edited afterwards.

---

## Execution

### Step 1: Determine the author model, then pick a different reviewer

**Do not rely on introspection.** The model running this cannot reliably name itself, and the "you are powered by" line in its own prompt is written when the session starts and **goes stale the moment the user switches with `/model`**. That line being wrong is the normal case, not the edge case.

**1a: Detect, as a best effort.** The author model is whatever has been generating code in this session. Read `ANTHROPIC_MODEL` from the environment if set, then check `.claude/settings.local.json`, `.claude/settings.json`, and the user level `.claude/settings.json` in the home directory for a `model` value. Map the id to a family: `claude-opus-*` to opus, `claude-sonnet-*` to sonnet, `claude-haiku-*` to haiku, `claude-fable-*` to fable. Treat the system prompt value as a weak last resort hint only.

**1b: Confirm, with one question.** A wrong guess reviews the code with the same model and defeats the point, so confirm before spawning. Pre select the detected family as the recommendation:

> "Which model wrote this code? I will review on a different one."
> Options: the detected family (recommended), plus the other strong models.

Skip the question only when detection was unambiguous **and** the user named an explicit reviewer, since that settles it.

**1c: Map to the contrasting reviewer.**

| Author model | Reviewer to spawn |
|---|---|
| opus | sonnet |
| sonnet | opus |
| fable | opus |
| haiku | sonnet |

Rules:

- **The reviewer is never the same family as the author.** This is the one invariant the mode exists to guarantee.
- **Never review with haiku.** Review is high value reasoning, so use a strong model.
- No differing strong model available, because of an organization restriction or a client whose subagents inherit the parent model? Fall back to the strongest available model that differs. If none differs, run the review inline on the author's model **and say so plainly**: that is a degraded review sharing the author's blind spots, not the guarantee. When independence matters, switching the active model beats accepting a same model review.
- The user named the author's own model as the reviewer? Refuse and explain: that is the model that wrote the code, and reviewing with it shares its blind spots. Use the contrast instead.

State the choice plainly before spawning:

> "Author on opus, running the review on sonnet. A second model catches what the author model is blind to."

### Step 2: Scope the change set, names only

Keep the main context lean. Gather file names and the base reference only. **The subagent runs the actual diff and reads the files.**

- Base branch: `main` if it exists, else `master`. Current branch: `git rev-parse --abbrev-ref HEAD`.
- Current equals base, meaning work directly on the base branch, so the mode is `uncommitted`. Gather names with `git diff --name-only HEAD`, plus untracked files via `git ls-files --others --exclude-standard`.
- Otherwise a feature branch, so the mode is `branch`, which is the equivalent of reviewing a pull request. Resolve the merge base with `git merge-base <base> HEAD`, then gather names with `git diff --name-only <merge-base>`, plus untracked files the same way.

The user passed `uncommitted`? Force that mode regardless of branch.

De duplicate the list. Exclude lock files and generated output from the count, though the subagent still sees the whole diff.

**Change set empty?** Stop and say there is nothing to review. Do not spawn.

### Step 3: Gather the pointers, without reading heavy files

Cheap signals only. The subagent reads on demand.

Resolve the **test signal**, which has three states and is not a yes or no:

- `configured`: a test runner is set up in the project manifest.
- `none-by-design`: no runner, and `code-standards.md` states the project gates on the type checker plus `/check verify` instead. Deliberate, so the gate is the safety net.
- `none-yet`: no runner and no stated position. A genuine gap.

Getting this wrong wastes the whole review on coverage nagging, so settle it before spawning.

Then collect the values the prompt template needs:

| Placeholder | What to put in it |
| --- | --- |
| `MODE`, `BASE`, `MERGE_BASE`, `CHANGED_FILES`, `DIFF_COMMAND` | the diff scope from step 2 |
| `CODE_STANDARDS` | the full contents of `code-standards.md` |
| `INVARIANTS_AND_BOUNDARIES` | the Invariants list and System Boundaries table from `architecture.md`, those two sections only |
| `VALUE_SOURCING` | the Value Sourcing table from `architecture.md`, or `none` |
| `TASK_ENTRY` | this task's entry in `build-plan.md`, with its bullets, or `none` |
| `USER_FLOWS` | the Core User Flow steps for any page the change touches, or `none` |
| `UI_REGISTRY_SUMMARY` | component names and paths from `ui-registry.md`, or `none` |
| `DESIGN` | the Build mandate and Component rules from `design.md`, for a diff touching the interface, or `none` |
| `TEST_SIGNAL` | resolved above |
| `OUTPUT_PATH` | `.konteksto/reviews/<date>-<task-slug>.md` |

### Step 4: Spawn the reviewer

Resolve this skill's folder to an absolute path and pass the absolute paths of the two bundled files. **Do not read their contents into the main context.** The subagent's first action is to read `review-agent-prompt.md` by path and follow it.

- **model**: the reviewer chosen in step 1, a different family from the author.
- **description**: `Review: <N> changed files on <reviewer-model>`.
- **tools**: read, search, run commands, and write. **No editing tool.** The reviewer reports, it does not change code.
- **prompt**: the absolute path to `review-agent-prompt.md`, an instruction to read it first and follow it, then `Placeholder values:` and a labeled list supplying every placeholder, with `REVIEW_GUIDE` as the absolute path to `review-guide.md`.

Fallback: if subagents in this client cannot read files, read both bundled files and inline their contents into the filled prompt instead.

### Step 5: Relay the result

The subagent errored, or wrote no findings file? Report the failure and offer to run it again. **Never relay an empty or invented review.**

Otherwise relay its summary:

```
## /check review complete

**Reviewed by**: <reviewer-model> (you are on <author-model>)
**Scope**: <N> files, <branch vs base | uncommitted>
**Findings file**: `.konteksto/reviews/<date>-<task-slug>.md`

**Verdict**: <Approve | Approve with nits | Changes requested | Blocked>

**Blockers** (<count>):
- <file:line, one line each>

**Major** (<count>):
- <file:line, one line each>

**Minor and nits**: <count>, see the findings file

**Strengths**: <one or two genuine positives>
```

Show every blocker and major in the chat, and collapse minors and nits to a count with a pointer to the file. Zero blockers and zero majors means lead with the verdict and keep it short.

For a high stakes change, meaning the verdict was Blocked or Changes requested, add one line:

> "For an independent second opinion from a different provider, switch your model or paste the diff into another assistant and run this again. No keys needed."

This mode is complete after relaying. It does not fix the findings, and it does not invoke another skill. Fixing them is `/develop`'s job, and a normal follow up.
