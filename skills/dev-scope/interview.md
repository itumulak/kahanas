# Interviewing for the real intent

Read this when the idea is too vague to build options from. Everything here is a way of asking, not a thing to write: whatever it surfaces goes into the sections of `project-overview.md` that step 3 already names, and this file adds no document of its own.

## When to run it

Run the interview when any of these is true:

- **A load bearing fact is missing** and you cannot guess it from the idea or the codebase: who benefits, why now, what success looks like, or the one constraint that binds everything else.
- **The request leans on convention instead of specifics.** "The usual dashboard", "standard auth", "a normal checkout". Every one of those is a different product to different people.
- **You are about to assume something** so you can keep moving.
- **The user asks for it**, in any of its forms: interview me, stress test this, poke holes in my idea.

**Skip it** when the ask is already unambiguous, when the user only wants information, or when they have said plainly that they want speed over certainty. An interview run on a clear request is an insult dressed as diligence.

## Why this is not the rounds rule

`SKILL.md` says to ask in small rounds, up to 4 related questions at a time, and that rule still holds for most of the file. This is the exception, and the two do not overlap.

**Rounds work when you can already name the options.** The page set, the navigation shape, the layout: you can put four of those on the table at once because the answer to one does not change what the others are.

**The interview is for when you cannot name the options yet**, because the answer to each question changes what the next question should be. Asking four at once there means three of them were the wrong questions, and the user answers all four anyway, which buries the one answer that mattered.

So: rounds by default, one question per turn only while the ground is still moving. When you can build a real options panel, stop interviewing and go back to rounds.

## Step 1: Say what you think, with a number

Before the first question, state your current understanding in one sentence, and put a confidence number on it from 0 to 100.

> I think you want a way for a small studio to send clients a link where they pick their favourite shots, and the studio sees the picks in one place. Confidence 55.

**Below 70, say what is unresolved.** The number on its own is theatre. What makes it useful is the sentence after it naming the thing you cannot see yet, because that is what the user corrects.

The number also keeps you honest with yourself. Writing 85 for something you have guessed twice is uncomfortable in exactly the way it should be.

## Step 2: One question per turn, each carrying your guess

Never ask a bare question. Every question comes with your specific guess at the answer.

> Who is picking the shots, the client alone or someone at the studio sitting with them? My guess is the client alone, on their own time, because the whole point is not having to book a call.

Two reasons this beats asking cold. Reacting to a concrete wrong answer is much faster for a person than generating a right one from nothing. And a guess commits you, so when it is wrong you learn something, where an open question just moves the work onto the user.

This is the same instinct as the decision panels rule in `SKILL.md`. A panel offers options with one recommended; here you cannot list options yet, so the guess is the recommendation.

## Step 3: Listen for should want

People answer with what they think they are supposed to want. The tells are consistent:

- **Best practice deflection.** "Whatever is standard", "the way everyone does it".
- **Convention deferring.** "I guess we need accounts", "obviously it needs a dashboard".
- **A buzzword standing where a specific belongs.** Real time, AI powered, seamless, scalable.

When you hear one, probe it once:

> If nobody was going to review this and you did not have to justify it, what would you actually want here?

Take the answer over the first one. A scope built on what someone thought they should say produces a build plan nobody wants and nobody can say why.

## Step 4: Restate in their words

Around 95 confidence, stop asking and write the intent back. Use the user's own words, not your tidied version of them, because a paraphrase into your vocabulary is exactly where a misunderstanding hides.

Cover six things, each on its own line so the user can correct one without re litigating the rest:

- **Outcome**: what is true after this works.
- **User**: who it is true for.
- **Why now**: what makes this worth building today.
- **Success**: how they will know it worked.
- **Constraint**: the one that actually binds. Time, money, an existing system, a person.
- **Out of scope**: what this is deliberately not.

**Out of scope is the line that earns the interview.** It is the one nobody volunteers and the one that saves the most work later, and it flows straight into Features out of Scope in step 3.

## Step 5: Take only a yes

Accept a direct yes and nothing else.

"Sounds good", "whatever you think", "yeah that works" are not agreement. They are a person being agreeable, usually because reading six lines of someone else's summary is tiring.

When you get one, reframe as a concrete choice instead of asking again:

> Before I write it: is the constraint the two week deadline, or the fact that the old system has to keep running? I have written the deadline. Which one is it?

A specific question gets a specific answer where a repeated request for approval gets a repeated shrug.

## When to stop

**You are done when you can predict the user's answer to your next three questions.**

That is deliberately testable rather than a feeling. Say the three predictions to yourself, and if you believe all three, ask none of them and go write the file. If you cannot call one, that is your next question.

Also stop when the user says to. A person cutting the interview short has told you something real about what they want, and continuing is not diligence.

## What this does not change

- **It never names a tool.** The guardrail in `SKILL.md` applies here in full. An interview that arrives at "so you want Postgres" has left this skill's job.
- **It writes no file of its own.** Everything it surfaces lands in `project-overview.md` through step 3, in the sections that already exist.
- **It does not replace step 3.** The template still gets worked through section by section. This only makes sure the answers going into it are the real ones.
