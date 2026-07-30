# Library Docs

*Purpose: version pinned notes on every non obvious external library the project depends on, so an agent never guesses at an API that changed between versions.*

Version specific notes for external libraries this project depends on. Only libraries whose API is non obvious, version sensitive, or easy to misuse get a section here; a library that works exactly as its own docs describe does not need one.

---

## <LIBRARY_NAME> (`<VERSION>`)

*Purpose: what this library is used for in this project, plus the exact gotcha or version specific behavior worth remembering. Repeat this whole section once per library that needs one.*

**Used for**: <WHAT_ITS_USED_FOR>

**Key notes**:
- <GOTCHA_OR_VERSION_SPECIFIC_NOTE>

```<LANGUAGE>
<SHORT_REAL_USAGE_EXAMPLE>
```

Repeat one `## <LIBRARY_NAME>` section per library worth documenting.
