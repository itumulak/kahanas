# Architect: after a document is written

Read this once a document exists on disk, not before. It covers checking your own work, offering a cross check, and confirming.

---

## First: did the write actually land?

If the file is missing or empty, something went wrong. **Report that and write it again.** Never produce a summary of a document that is not there, because a confident summary of a missing file is the worst possible failure here: everything downstream trusts it.

Only once the file exists, continue.

## Check your own work before presenting it

Read back what you just wrote. Confirm every section the template requires is present **and filled**, not left as a placeholder.

The ones most often left blank, because they are the ones that take real thought:

- **`architecture.md`**: the Value Sourcing table, the Invariants, the Security model, and the System Boundaries. A boundary table with one example row in it is not filled.
- **`code-standards.md`**: the environment variable table, the error handling rules, and the Definition of Done. A Definition of Done whose rows name no real command is the worst of the three, because every later skill treats it as a bar that was set.
- **`build-plan.md`**: whether the Feature Count actually matches the number of tasks written.
- **`design.md`**: the States section, meaning empty, loading, and error.

Where something came out blank or still holds a placeholder, **say so explicitly when you present it**:

> Incomplete: the Security model in `architecture.md` is still a placeholder. Tell me what it should be and I will fill it.

A blank field you did not flag reads as a field nobody needed.

## Offer a cross check

An independent read catches load bearing gaps the author cannot see, because the author's blind spot is exactly what made it a gap.

**Always ask. Never run it, and never skip it, on the user's behalf.** The point is that a load bearing gap stays visible to the person who has to live with it, so the choice is theirs.

Present four options, with a recommendation:

1. **Another model** (recommend this for anything foundational or risky): a read only critique on a different capable model, which catches what the model that wrote this is blind to.
2. **This same model**: a fresh read of its own work. Weaker, but not nothing.
3. **I will read it myself**: no critique, just show it.
4. **Skip**.

On either model option, spawn a **read only** subagent with its model set explicitly rather than inherited. It reads the document and returns a critique. **It writes nothing**, and every fix stays with you.

Brief it on two jobs, in this order:

**1. Decision completeness, the primary job.** List every value the product must produce, compute, or display whose **source this document does not name**, and every decision a builder would have to invent because nothing settles it. This is the check that catches what the author's own review missed, for example an acceptance step needing the user's local day with no timezone source named anywhere.

**2. Soundness.** Does the design hold up? Is there a materially simpler option? What failure mode is missing?

**Do not silently fix a decision completeness gap.** Each one is a load bearing decision, and those belong to the user, not to you. List every gap **with the resolution you recommend**, meaning the source you would name or the answer you would pick, then ask: apply the recommended fixes, answer each one individually, or leave them.

A pure wording improvement you may just fix, and mention.

**A finished cross check is not acceptance.** Whatever it found, you still present the document and ask.

## Confirm

Tell the user where the document is, one line on what it decided, and the cross check verdict if one ran. Then ask:

> Accept this, or change something?
>
> 1. **Accept** (recommended)
> 2. **Change something, I will tell you what**
> 3. **Rethink the approach**

On **change**, apply targeted edits to the sections named. **Never a rewrite from scratch**, since that quietly discards decisions already made.

On **rethink**, go back to the relevant stage and revise.

Either way, **present the same question again** rather than settling for a "yes" in passing. Loop until Accept.

This also covers a premise challenge the user disagrees with. Remove it and proceed in their direction, since raising it was the obligation, not winning it.

## Close with a plain summary

After acceptance, a short summary in plain language, separate from the document's own:

```
Done. Here is the quick version.
What we decided: <one plain sentence>.
Why: <one plain sentence>.
What is next: <the skill to run, and what it will do>.
```

Gloss any jargon. This is the human read, and it is the part someone actually remembers.
