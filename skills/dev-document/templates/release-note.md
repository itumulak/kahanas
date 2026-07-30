# Release note template

Written to `.konteksto/releases/<version>.md`. The audience is people who use the product, not people who build it.

```markdown
# <Version>

_<Date>_

<One or two sentences on what this release is about. The headline, in plain language.>

## What is new

### <Feature name, as a user would say it>

<What it does and why someone would want it. No internal names, no file paths, no framework names.>

## What is better

- <An improvement to something that already existed.>

## What is fixed

- <A problem someone would have noticed, described as they would have experienced it.>

## Anything you need to do

<Migration steps, a changed setting, a deprecation with its date. Omit this heading entirely when the answer is nothing.>
```

**Rules:**

- **Translate out of engineering vocabulary.** A user does not know what a middleware is, and does not need to.
- **Lead with what people asked for.** The order is by what matters to a reader, never by what was hard to build.
- **Anything requiring action goes last and unmissable.** That is the part people come back to hunt for.
- Silence beats padding. A small release gets a short note.
