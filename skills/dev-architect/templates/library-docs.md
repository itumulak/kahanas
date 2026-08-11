# Library Docs

*Purpose: version pinned notes on every non obvious external library the project depends on, so an agent never guesses at an API that changed between versions.*

Version specific notes for external libraries this project depends on. Only libraries whose API is non obvious, version sensitive, or easy to misuse get a section here; a library that works exactly as its own docs describe does not need one.

---

## Where a note comes from

*Purpose: the sourcing rule for this file. Keep this section as it is written here. Every skill that reads or adds to this file relies on it, and a note whose origin nobody recorded is indistinguishable from a note somebody made up.*

**Every section carries a Source line, and it is either a real URL or an honest admission.** A note written from memory and a note read off the official docs look exactly alike on the page, and only one of them is safe to build against. The Source line is what tells them apart.

**Read the version first, from the project's own manifest.** `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, or whatever this project uses. Then fetch the docs page for that version. A note pinned to a version you never checked is worse than no note, because it looks pinned.

**What counts as a source**, in order:

1. The library's own documentation, on the page for the API in question rather than the homepage.
2. Its own changelog or release notes.
3. A standards body, for platform behavior rather than library behavior.

**What does not count**: a question and answer site, somebody's blog, a summary written by a model, or your own recollection. None of those is wrong often enough to feel dangerous, which is what makes them dangerous.

**When you cannot verify it, say so on the Source line and keep the note.** A gotcha you remember is still worth writing down. Marking it unverified costs one line and tells the next reader to check before leaning on it. Hedging inside the note itself does not, because "I believe" reads as prose and gets skimmed.

---

## <LIBRARY_NAME> (`<VERSION>`)

*Purpose: what this library is used for in this project, plus the exact gotcha or version specific behavior worth remembering. Repeat this whole section once per library that needs one.*

**Used for**: <WHAT_ITS_USED_FOR>

**Source**: <FULL_URL_TO_THE_EXACT_DOCS_PAGE>, read <YYYY-MM-DD>

**Key notes**:
- <GOTCHA_OR_VERSION_SPECIFIC_NOTE>

```<LANGUAGE>
<SHORT_REAL_USAGE_EXAMPLE>
```

Repeat one `## <LIBRARY_NAME>` section per library worth documenting.

### The Source line, in its three shapes

**Verified**, the normal case. The URL points at the page carrying this behavior, with its anchor when the page is long, and the date is when you actually read it:

```
**Source**: https://example.dev/reference/some-api#caveats, read 2026-08-11
```

**Unverified**, when the note is worth keeping but you did not confirm it:

```
**Source**: none, written from model knowledge and not checked against the official docs
```

**Stub**, when the package is known to be here but nobody has written the notes yet. `/dev-sync` writes this shape when a manifest gains a dependency, and it means the section is a placeholder rather than a claim:

```
**Source**: none yet, stub added from the manifest, needs `/dev-architect`
```

**The date matters as much as the URL.** Documentation moves, and a URL alone cannot tell a later reader whether the note is from this release or two before it.

---

## Accepted risks (Optional)

*Purpose: a dependency the project knowingly keeps despite a known problem, so it reads as a decision rather than an oversight. This is where a declined vulnerability update lands. Delete the section when there are none, rather than leaving it empty.*

**<LIBRARY_NAME>** (`<VERSION>`): <WHAT_THE_PROBLEM_IS>. Kept because <REASON>. Decided <YYYY-MM-DD>.
