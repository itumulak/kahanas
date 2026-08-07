# Postmortem template

Written to `.konteksto/postmortems/<date>-<slug>.md`.

```markdown
# <A short description of what broke>

**Date:** <when it happened>
**Duration:** <from first impact to resolved>
**Impact:** <who was affected, how many, and what they could not do>
**Severity:** <how bad, on whatever scale the team uses>

## What happened

<The plain account, in order. Two or three paragraphs.>

## Timeline

| Time | What happened |
| --- | --- |
| <time> | <the change, alert, or action> |

<Times a person gave you for the incident itself. For anything the workflow did, take the time from note-registry.md rather than from a commit date, since a commit date is when the fix was written and a note row is when it was watched to work.>

## Root cause

<The proven cause, with the evidence. Where /dev-debug investigated this, its record already holds a cause confirmed by evidence rather than assumed, so use that: the cause and fix from the decision log, and the confirming check and its time from note-registry.md.>

## Why it was not caught sooner

<Honest. The gap in the tests, the check, the monitoring, or the review. This section is the one that changes anything.>

## What fixed it

<The change that resolved it, and whether it is permanent or a stopgap.>

## What we are changing

| Action | Why | Owner |
| --- | --- | --- |
| <the specific change> | <the gap it closes> | <who> |

## What went well

<Genuinely. What limited the damage, what worked, who caught it.>
```

**Rules:**

- **Blame the system, never a person.** "The deploy step had no confirmation" is useful. Naming who ran it is not, and it guarantees the next person stays quiet.
- **A root cause needs its evidence.** Never "probably a race condition". If it was not proven, say it was not proven, and say what would prove it.
- **Never soften the timeline.** A postmortem that reads comfortably has usually had the useful part removed.
- **Every action is specific and owned.** "Improve monitoring" is not an action. "Alert when the queue is over a thousand for five minutes" is.
- **Keep the what went well section.** It is not decoration: it records what to protect while fixing everything else.
