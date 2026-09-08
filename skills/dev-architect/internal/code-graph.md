# Architect: the code graph, offered once and recorded either way

Read this at step 6b, or earlier on an existing codebase, per the timing note at the bottom. It covers one tool: a code graph the later skills query to find code. It is not the skill and MCP discovery in `internal/tool-discovery.md`, which serves the stack this product ships. This serves the agents that build it, so it is offered on every project including one whose stack is already settled and needs nothing installed.

**Skip the whole file when `tooling.md` already has a Code Graph section with a Status.** `WIRED`, `DECLINED`, and `DEFERRED` are all answers, and re asking an answered question is the nag this project keeps ruling out.

## What a code graph is, in the sentence you will use

A code graph is a parsed index of the codebase: every symbol, which file holds it, what it imports, and what calls it. A skill about to change something asks the graph where that thing lives instead of reading its way there, which is the largest context cost in any repository past a few hundred files.

The tools in this category also offer a second pass that has a model write a plain English summary of each area. That part costs money and is worth naming separately, because it is the part that can go stale and the part with a bill.

## Step 1: Ask first, this is a consent gate

<!-- TOOL-CONSENT:START -->
**Asking is mandatory. Searching is not.** Nothing is searched, fetched, installed, or spawned for skill and MCP discovery until the user has picked. Offer four choices: find them for me, I will name the ones I want, no and record the decline, or not now. Only the first may run a search. Never silently skip the offer, and never run a search before the user agrees to one.
<!-- TOOL-CONSENT:END -->

The same gate applies here, and the choices are shaped to this one tool. Explain the value in a sentence or two in your own words, then say what it touches, then ask. Something close to:

> A code graph lets a build session ask where something lives rather than reading its way there, which is where most of the context on a large repository goes. The structural pass is a parser, so it needs no key and costs nothing. There is an optional pass that has a model summarise each area, and that one spends your own provider credit.

**Say what the wiring writes before they answer, not after.** The wiring step of a tool in this category typically adds an instruction file, a skill file under the agent's own configuration, an MCP registration, and sometimes a statusline and hooks. That is the person's own setup, and somebody who already has a statusline they like deserves to know that before saying yes rather than after.

Then present a panel with exactly one option marked as recommended.

- **question**: "Want a code graph on this project, so build sessions can look code up instead of reading for it?"
- **header**: "Code graph"
- **options**:
  1. `Yes, structural only` (recommended): "You install and wire it, I build the graph. No key, no cost, and the skills that benefit start using it."
  2. `Yes, and the summaries too`: "Same, plus a pass where a model summarises each area. Spends your provider credit, and I will name the command that does it so you see the cost."
  3. `No, skip it`: "Nothing installed. I record the decline so no later session offers it again."
  4. `Not now, later`: "I write it up as deferred with the commands ready, so you can turn it on whenever."

**Act on the pick:**

- **Yes, structural only** goes to steps 2, 3, and 5.
- **Yes, and the summaries too** goes to steps 2, 3, 4, and 5.
- **No, skip it** goes to step 5 with Status `DECLINED` and nothing else run.
- **Not now, later** goes to step 5 with Status `DEFERRED`, the commands recorded and none of them run.

**Never run any command in this file before the panel is answered.** Not the install, not a version probe, and not a search for which tool to use.

## Step 2: Pick the tool, and check it the same way you check any other

**Do not propose a tool from memory and never invent an install command.** Fetch its real page, confirm the repository is public and recently maintained, and confirm it parses the languages in the Stack table. A graph tool that handles the product's main language poorly is worse than no graph, because it answers confidently about the part it got wrong.

Say which checks it passed, in one line each, before the person installs anything.

Two facts about the codebase decide whether it is worth it at all, and both are cheap to get:

- **How many source files there are.** A repository of thirty files is read faster than a graph is built. Say so and let the person decline with the number in front of them.
- **Whether the main language is one the tool resolves across files**, rather than one it only lists symbols for. Cross file resolution is the whole value.

**Where the person already runs a graph tool of their own**, that is the tool. Record it and its commands and skip the install.

## Step 3: Install, wire, and build

**The person runs the install and the wiring. You run the build.** The split is the one already used for MCP servers, and it is in the Code Graph section of `tooling.md` with the reasoning. Give the exact commands from the tool's own documentation, one at a time, and wait.

**Already installed and wired before this ran?** That is the common case, since somebody who wants a graph usually sets it up before asking anybody. Confirm it rather than reinstalling it, name what is already there, and go straight to the build and the check below. The only thing missing was the record.

Then build the graph yourself, from the project root, and report what it produced: how many files it parsed, how long it took, and where the cache landed.

**Add the cache directory to `.gitignore` if the wiring did not.** It is a regenerable cache and a graph in a diff is noise nobody reads.

**Confirm the graph answers before you record it as working.** Run the locate command against something you already know the answer to, from the Stack table or a file you have read, and check it comes back with that file. An install that returned zero proves the package downloaded, not that the graph is usable, which is the same lesson the Visual verification Check row exists for.

## Step 4: The enrichment pass, only on the second option

Run it only when the person picked the summaries, and **name the command and its provider before you run it** so the bill is not a surprise. Report what it cost if the tool reports it.

**One pass and no refresh loop.** Nothing in this workflow re enriches a graph on its own, because the summaries are a convenience and a repeated bill for a convenience is how a person ends up turning the whole thing off.

## Step 5: Record

Fill the Code Graph section of `tooling.md` from the template, every row, including the ones that read none.

- **Status** is `WIRED`, `DECLINED`, or `DEFERRED`, and it is what a later session reads to know the question is answered.
- **Enrichment** says structural only or summaries too, and which provider key paid, by environment variable name and never a value.
- **A decline also goes in Considered and Rejected**, kind `code graph`, with the reason in the person's terms. A repository too small for one is a good reason and worth writing down as that.
- **Append the panel to `human-decisions.md`**, with the question, all four options, the recommendation marker as presented, and the option they checked. A decision about cost is exactly the kind that gets re litigated later.

**Do not write the trust rule into `tooling.md` yourself beyond what the template carries.** The template already holds it, the later skills point at it, and a second copy in your own words is the drift this project keeps finding.

## Timing, and the one case for running this early

Step 6b is the normal place: the stack is settled, so you know which languages matter, and the panel sits beside the other tooling questions rather than interrupting the design conversation.

**On an existing codebase, offer it before step 4 instead.** The brownfield audit reads structure and dependencies across a repository somebody else wrote, which is the single task in this skill that a graph helps most. The gate, the checks, and the recording are identical wherever it runs, and it runs once either way.
