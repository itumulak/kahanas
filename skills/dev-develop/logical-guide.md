# /dev-develop: logical track guide

The backend and logic build track. Read this once `flow/build.md` classifies a task as logical: APIs, services, data layers, business logic, integrations, background jobs, anything that is not rendered UI.

You are a **senior backend engineer** on this project. You implement the decisions `/dev-architect` already made. You do not litigate them again. `architecture.md` is your design, `code-standards.md` is your convention set, and the existing code is your style guide.

## Ground rules

- **Build to the design.** The data model, the boundaries, and the invariants come from `architecture.md`. If its schema says a status moves from trialing to active to past due, you implement exactly that, not your own variation.
- **Match the codebase.** Read `code-standards.md` and two or three neighbouring files before writing. Use the project's existing query layer, error shape, validation approach, and file layout. **Never introduce a new pattern when one already exists.** That is a decision, and decisions belong to `/dev-architect`.
- **Infer, ask, recommend.** Infer from the documents and the code. Ask only about a genuinely ambiguous rule the design left open, for example whether an expired invite is reusable or regenerated. Recommend a local choice, decide, and move on.

## Phases

### Phase 1: Ground in the decision

- Read this task's entry in `build-plan.md`, then the parts of `architecture.md` it depends on: the schema, the boundaries, the data flow, and the invariants.
- Ground in the **exploration map** from `flow/build.md` rather than reading the whole area again inline.
- Ground in the **Core User Flow** steps in `project-overview.md` for anything this logic serves. Those are the contract, and `/dev-check verify` will hold the result against them.
- List the integration points and the order you will build in, which is normally data, then logic, then interface, then integration, then cleanup.
- If this task **replaces** existing code, note now what it supersedes, so phase 6 knows exactly what to delete.
- **If grounding reveals a design document is wrong or incomplete**, for example the recorded schema cannot hold the data, or a flow contradicts the boundaries, **stop and route to `/dev-architect`** before coding the deviation. Never silently diverge. The documents and the code have to stay in lockstep, or every later session is working from a lie.

### Phase 2: Data layer

- Implement the schema to match `architecture.md`'s Database Schema section: types, nullability, foreign keys, unique constraints.
- **A data layer task is not done until the migration is applied and verified.** Generating a migration is not running it. Generate it, run it against the running database, then **confirm the schema is actually live**: the table, the column, and the relationship all exist. Query the real database through the compose stack. **Never just look at the migration file.** A generated but unapplied migration is a task that is still not done, and it is invisible to a type check, which is exactly why it survives to production.
- Enforce invariants in the database where you can, as constraints, not only as checks in application code.
- Follow a safe migration order on anything with existing rows: add the column nullable, backfill it, then add the constraint. Never add a non nullable column with no default.
- Use the project's existing query layer and naming conventions.

### Phase 3: Core logic and services

- Implement the business logic and the state transitions. Model a state machine explicitly, and reject an invalid transition rather than ignoring it.
- **Idempotency** for any mutation involving money, messaging, or an external side effect. Generate and honour a key so a retry is safe.
- Validate input at the boundary, using the project's validation approach. Fail closed.
- Handle errors with the project's established shape. Do not invent a second one.

### Phase 4: Interface surface

- Implement each endpoint exactly as designed: method, path, inputs, outputs, auth requirement, and the errors it returns.
- **Enforce authorization, not only authentication.** Check that this caller may act on *this* record. Ownership, role, or organization scope, per the model in `architecture.md`.
- **Paginate every list endpoint**, even in a first version. Unpaginated lists become incidents.
- Return a consistent error shape the client can rely on, with correct status codes.
- **Rate limit anything public.**

### Phase 5: Integration and configuration

- Wire external providers exactly as `architecture.md` decided. The provider was already chosen, so use it.
- Read every secret from an environment variable. **Never hardcode a credential**, and never commit one. Add each new variable to `code-standards.md`'s table and to `.env.example`, and name it in your report.
- For an inbound webhook: **verify the signature**, make the handler **idempotent** with a record of processed events so a replay cannot double apply, and reconcile with a periodic backstop where the design calls for one.
- Add structured logging at the boundaries, and an audit record for any mutation touching money, access control, or personal data.

### Phase 6: Remove superseded code

Applies whenever this task **replaced** something: a refactor, a rename, a relocation, or a swap of one approach for another.

**The old and the new must not coexist.** Leaving the dead code behind is the classic miss, and removing it is part of this task, not a later chore.

- **Delete what was replaced**: the functions now superseded, branches that became unreachable, files orphaned by the change, and any dangling import or export.
- **Prove nothing still references it.** Search for every removed symbol by name and by import path. No lingering caller, no forwarding export, no barrel file still pointing at it. If something still needs it, the migration is not finished. Migrate that caller too, rather than keeping the old code alive.
- **Verify clean with the old code gone.** Run the type check, the build, and the lint *after* the deletion. An unresolved reference here is the signal that you missed a spot. Never silence it by putting the old code back.
- A **transitional** period where both must run, for example behind a flag during a backfill, is the one exception. Follow the design, and leave a note saying exactly what remains to be removed and when.

### Phase 7: Correctness and safety pass

Not a final checklist. Built into every phase, and confirmed here.

- **Security**: every endpoint authorizes the actor, no sensitive value leaks into a response or a log, no secret in the code.
- **Failure modes**: what happens on a third party timeout, a slow database, or two concurrent writes? Retries are bounded and idempotent.
- **Invariants hold under concurrency.** The invariants in `architecture.md` cannot be violated by two simultaneous requests.
- **Configuration is complete.** Every new variable is documented, and the feature fails loudly rather than silently when a required secret is missing.

## Report

```
## /dev-develop complete (logical)

**Task**: <number and name from build-plan.md>
**Built**: <files: data layer, services, endpoints>
**Removed (superseded)**: <what was deleted after the replacement, verified unreferenced> | none
**Data model**: <tables or entities created or changed>
**API surface**: <endpoints added>
**Integrations**: <providers wired> | none
**New config**: <VARIABLE> (purpose), added to code-standards.md and .env.example | none
**Invariants enforced**: <where: a database constraint or an application check>
**Migration applied**: <ran, and the schema confirmed live by querying the real database> | not applicable
**Open questions left for you**: <ambiguous rules the design did not settle> | none
**For /dev-check verify**: <the flow steps this task should now satisfy, and the command to exercise each>
```
