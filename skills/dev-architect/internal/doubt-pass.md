# Architect: doubting a decision before it stands

Read this once the design conversation has settled its decisions and before any document is written. It applies to a few decisions per project, not to all of them, and the trigger list below is the whole of it.

The idea is narrow: **a decision that is expensive to undo gets read by something that does not already believe it.** Later skills inherit these decisions and build on them, so a wrong one gets more expensive every task, and you are the worst possible reviewer of your own reasoning because the blind spot that produced it is still there.

---

## How this differs from the cross check

`after-writing.md` also offers an independent read, and the two do different jobs. Running both is normal.

| | The doubt pass, here | The cross check, in `after-writing.md` |
| --- | --- | --- |
| When | before the document is written | after it exists on disk |
| Scope | one decision | the whole document |
| Brief | find what is wrong with this | is anything load bearing missing |
| Who chooses | you, as part of forming your recommendation | the user, always asked |

**You do not ask permission for this one, and that is deliberate.** The cross check is asked because it surfaces load bearing gaps that belong to the user, and a person has to decide what happens to those. The doubt pass is part of arriving at your own recommendation, which is what you were called here to do. Asking whether you may think harder about your own advice is not consent, it is delay.

What you do owe the user is the result: say what the doubt pass found and what you changed because of it, before they accept anything.

## When to run it

Run it on a decision that meets any of these:

- **Undoing it means rewriting code that does not exist yet.** The stack, the data model, the tenant isolation model, the auth approach. Every one of those is cheap now and costs a rewrite later.
- **It asserts a property nobody can see in the code.** That an operation is safe to retry, that an order is guaranteed, that two things cannot happen at once. These read as facts in a document and are only ever beliefs.
- **It crosses a system boundary** in `architecture.md`, so a mistake shows up in a component whose author never saw this decision.
- **It rests on context a future reader will not have.** A constraint from a conversation, a limit in somebody's existing system, a deadline.

**Do not run it** on a choice among options the documents already permit, on anything reversible in an afternoon, or when the user has said plainly they want speed. A doubt pass on a settled convention burns a subagent and buys nothing, and running one on everything is how a design pass turns into an afternoon.

Expect a handful per project. If you are on the fifth, check that you are not doubting your way around a decision the user already made.

## Step 1: Name the decision

One sentence, no argument attached.

> Every tenant's rows live in one shared table, separated by a tenant identifier column, rather than a schema per tenant.

Then one sentence on why being wrong here is expensive, which is what justifies the next four steps.

## Step 2: Strip it to the artifact and the contract

Two things go to the doubter, and nothing else.

- **The artifact**: the decision itself, plus whatever it must be read against. The relevant part of the schema, the boundary, the invariant. Enough to judge, and no more.
- **The contract**: what it has to satisfy. The flows it serves, the scale in the user's own answers, the constraint that binds, the compliance rule if one is active.

**Leave out your reasoning, including the part you are proudest of.** This is the whole mechanic, and it is the step most likely to get quietly skipped.

A reviewer given your argument reviews the argument. It will find your reasoning coherent, because it is, and coherent reasoning from a wrong premise is exactly the failure you are trying to catch. Given only the artifact and the contract, it has to work out for itself whether the thing satisfies the thing, which is the actual question.

Same rule for your confidence. Do not tell it you are fairly sure, and do not tell it which part worries you, because naming your worry is how you get a review of your worry instead of a review of the decision.

## Step 3: Send it to a doubter

Spawn a **read only** subagent. Set its model explicitly rather than inheriting this session's, and use a different capable model where one is available, for the reason the review mode already states: a model reading its own output shares its own blind spots.

Give it the artifact, the contract, and this brief:

> Find what is wrong with this. Assume the author is overconfident and that something here does not hold.
>
> For each problem: name it, say the specific situation where it breaks, and say what it costs. A concrete failing case beats a general worry.
>
> Do not suggest a redesign, do not rank your findings, and do not tell me the parts that look fine. If you genuinely find nothing, say so in one line rather than filling the space.

**Write nothing on its behalf.** It returns findings, and every change stays with you.

## Step 4: Sort what comes back

Put every finding in exactly one of four boxes, and say which for each. Sorting is the work here, because an unsorted list of objections is just anxiety.

- **It misread the contract.** The concern is real for a contract this project does not have. Nothing changes, but read your own contract statement again first: a doubter misreading it is often the contract being genuinely unclear, and that unclarity will reach `/dev-develop` too.
- **A real problem.** Change the decision now, before it is written down. This is the entire return on the exercise.
- **A trade off worth accepting.** The cost is real and the alternative is worse. **Write the trade off into the document's own reasoning**, in the Why these choices list or beside the decision, since a cost nobody recorded is a cost the next reader will discover at the worst time.
- **Noise.** Say it was noise and move on.

**Go back to the artifact text before you sort.** A finding that looks wrong from memory is sometimes right about the text you actually wrote.

**Do not accept a finding just because a reviewer produced it.** An adversarial brief guarantees objections, so some of them will be manufactured. Deciding is still your job, and forwarding an unsorted list to the user is refusing it.

## Step 5: Stop

Stop at the first of these:

- **The findings have gone trivial.** One round is often enough. This is the normal ending.
- **Three rounds have run.** Hard cap.
- **The user says stop.**

**At three rounds with something substantive still unresolved, take it to the user.** Say the decision, what the doubter keeps returning to, what you changed already, and the two options you are choosing between. A decision that survives three adversarial rounds unresolved is not a decision one more round settles, it is one that needs a fact only the user has.

## What this writes

**No file of its own, and no row anywhere.**

A change lands in the document being written. An accepted trade off lands in that document's own reasoning. Nothing goes in `decision-log.md`: that file belongs to `/dev-develop` and `/dev-debug`, it holds decisions made during a build, and this skill only ever creates it empty. Writing a row there would make a fourth writer on an append only log and would date a build decision to before the build.

Then say it out loud when you present the document:

> I doubted the tenant isolation decision before writing it. The doubter found that the shared table approach makes a per tenant export a full table scan. That is real, we accept it because exports are rare and monthly, and I have written the cost into the Why these choices list.

Say it even when nothing came back. A doubt pass that found nothing is information about how much the decision has been tested, and silence reads as a pass that never ran.
