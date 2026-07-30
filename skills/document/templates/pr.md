# PR template

Write a title and a body. The title is one line, in the imperative, naming what changed rather than what you did: "add session expiry to the auth middleware", not "changes for auth".

```markdown
## What this does

<Two or three sentences. What changed, and what it now makes possible. Written for someone who has not read the ticket.>

## Why

<The reason, from the decision log or the build plan. Not "because the task said so". What problem does this remove.>

## How it works

<Only the parts a reviewer cannot get from the diff: the approach taken, and anything non obvious about it. Skip this when the diff is self explanatory.>

## Risk

<Lead with this when it is real. Auth, payments, personal data, a migration, or a change to shared code. Say what could go wrong and what would catch it. Write "low, isolated to X" when it genuinely is.>

## How it was checked

<What actually ran. The output of /check verify, the test suite, the manual walk through. Say plainly when something was not checked.>

## Notes for the reviewer

<Where to start, anything you are unsure about, anything deliberately left for later.>
```

**Rules:**

- **Risk goes near the top when it is real.** A reviewer rations attention, so burying the dangerous part costs you the review you needed.
- **Never claim a check you did not run.** "Tests pass" when you did not run them is the fastest way to lose a reviewer's trust permanently.
- Keep it as short as the change deserves. A one line fix does not need six headings, so drop the ones that would be empty.
