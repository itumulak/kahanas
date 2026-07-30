# Architect: pattern and stack defaults

Read this during the stack walk, in step 2. It holds the defaults to reason from, and the opinions to apply when the user has no strong preference.

**These are starting positions, not answers.** A project with a real constraint overrides any of them, and you say so in the "Why these choices" list.

---

## Pick the pattern before you pick any technology

The shape of the system comes first. Choosing a framework before deciding whether this is one application or several is choosing the answer before understanding the question.

| Scale and team | Pattern | Why |
|---|---|---|
| Small, under a thousand users, up to five people | **One application** | Simplest to build, deploy, debug, and change. Extract nothing until a real bottleneck forces it. |
| Medium, up to a hundred thousand users, five to fifteen people | **One application, layered** | Clean separation inside a single deployable unit, without distributed system complexity. |
| Large, beyond that, with clear ownership boundaries | **Two or three focused services**, split at domain boundaries | The split is driven by team ownership and a specific measured bottleneck, never by architectural taste. |
| Data heavy | **Decide batch against streaming first** | Batch is simpler and usually sufficient. Stream only when latency or volume genuinely forces it. |

---

## Reason in the category, then pick the product fresh

This is the important part of this file.

**The category is durable. The product name rots.** A recommendation written as a specific product is wrong within a year or two. A recommendation written as a category stays true, and you pick today's best fit inside it at the moment you are asked.

So: use the table below for the **mechanism**, then choose the actual product fresh, preferring whatever the project already runs, and verifying the current landscape when the user has agreed to a web check.

**Never treat a parenthetical example as the recommendation.**

| Layer | The default category, unless evidence says otherwise |
|---|---|
| **Primary database** | **A relational database.** Transactions, relations, structured document support, mature tooling, and it scales to tens of millions of rows without specialist knowledge. |
| **Cache** | **An in memory cache**, treated as disposable. **Never as the primary store.** |
| **Auth** | **A proven library or service. Never built from scratch.** |
| **Background work** | **A database backed queue first.** Add a dedicated broker only when throughput actually demands it. |
| **File storage** | **Object storage. Never files in the database.** |
| **Search** | **The database's own full text search first.** Add a dedicated search engine only when the database genuinely cannot meet the query requirements. |
| **Observability** | **Structured logging plus error tracking, from day one**, not retrofitted later. |

---

## Opinions to apply on a foundational stack decision

- **One application first, always.** Faster to build, easier to debug, simpler to operate. **You can extract services later. You cannot easily merge them back.**
- **A relational database is the right default.** Most products never meet a workload a mature relational database cannot handle. The case against it is specific: document storage with no relational querying, key value at extreme read scale, or time series at high ingest. None of those describe a typical application.
- **Short lived functions have real tradeoffs.** Cold starts, no state, an execution ceiling, and no persistent database connections without a proxy in front. State these in the document. It is not a free upgrade over something that stays running.
- **Defer multiple regions until something requires it.** Running active in more than one region is among the hardest problems in distributed systems, and it is rarely the problem a young product actually has.
- **An object mapper for ordinary work, hand written queries for the complex parts.** Mappers remove boilerplate for straightforward reads and writes. For reporting, aggregation, and complicated joins, write the query. Do not push complex logic through the mapper.
- **Full container orchestration assumes a platform engineering function.** A small team running one themselves spends a large share of its time on infrastructure rather than the product. Without dedicated infrastructure people, prefer a managed platform that removes that burden.

---

## Opinions to apply on a feature

- **Idempotency from day one.** Every mutation is safe to retry, and anything involving money, messaging, or an external side effect carries a key that makes a retry harmless.
- **Pagination is not optional.** Every list endpoint paginates, including in a first version. **Unpaginated lists become incidents**, and always later, under load, at the worst moment.
- **Soft deletes are usually wrong.** They pollute every query, break unique constraints, and leave ghost data behind. Prefer an explicit archived timestamp, or a separate archive table.
- **Do not store a derived value** unless you have measured a performance problem that requires it. Compute it when it is read. **Stored derived values go stale**, and nothing tells you when.
- **Audit records are required** for any change touching money, access control, or personal data. Add them now, because retrofitting them means reconstructing history you no longer have.
- **Rate limit anything public.** No exceptions for an early version. It takes an hour and prevents a whole class of abuse.
- **Never put a secret in the database or the codebase.** Environment variables or a secrets manager, for every key, token, and credential.

---

## The order to think in, for a feature

Work through these in order, and skip none:

1. **The real problem.** The job this feature is hired to do, and the outcome someone actually cares about. Not the feature they asked for.
2. **The data model.** Entities, their lifecycle states, and the invariants that must always hold. Draw the state machine where transitions exist.
3. **Consistency.** Who writes, who reads, how often, and whether a reader can tolerate being slightly behind.
4. **The interface surface.** The smallest one that solves the problem. Per endpoint: its name, its method and path, the few key inputs with types and whether each is required, the key outputs, the auth requirement, and the two or three errors that change how a caller must behave.
5. **Failure modes.** A slow database, a third party that stops answering, two people acting at the same moment. **Design for these rather than against them.**
6. **The security surface.** What is sensitive, who may read it, who may change it.
7. **Configuration.** Every new environment variable, secret, and credential, each named with its purpose. Where a third party account must exist before coding starts, that is a prerequisite worth saying out loud.

---

## When you present options

**Always include the simplest option**, meaning the one with the fewest moving parts and the shortest path to working. Present it honestly rather than as a straw man to be dismissed.

Then your recommendation, and a meaningfully different alternative where one genuinely exists.

**An option with no drawbacks has not been described fairly.** Give each one at least one real cost.
