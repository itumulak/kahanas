# Changelog template

Appended to `CHANGELOG.md`, under the unreleased heading. Follow the file's existing style where it has one.

```markdown
## [Unreleased]

### Added
- <A capability that did not exist before, described by what it lets someone do.>

### Changed
- <Behavior that is different now. Say what it was and what it is, since that is what a reader needs.>

### Fixed
- <A bug that is gone. Describe the symptom someone would have noticed, not the internal cause.>

### Removed
- <Something taken out, and what to use instead.>

### Security
- <A vulnerability fixed, or a dependency updated for one. Always its own entry, never folded into Fixed.>
```

**Rules:**

- **Write the effect, not the implementation.** "Sessions now expire after thirty days" beats "refactored the token expiry check". A developer scanning this wants to know whether it affects them.
- **One entry per user visible change.** Five commits producing one behavior are one entry.
- **Omit an empty heading.** Never leave "### Removed" with nothing under it.
- **Security gets its own heading, always.** People scan for that one specifically, and folding it into Fixed hides it from exactly the reader who needed it.
- Internal refactors with no visible effect do not belong here. That is what the commit history is for.
