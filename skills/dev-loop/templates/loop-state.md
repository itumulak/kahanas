# Dev Loop State

*Purpose: resumable control state for one `/dev-loop` run. The build plan and progress tracker remain the source of truth for task status.*

- Selected tasks: <ordered task IDs>
- Current task: <task ID or none>
- Phase: <develop|verify|debug|test|audit|qa|complete|blocked>
- Failed attempts by task and route: <task ID / route: count>
- Total repair attempts this run: <0 to 30>
- Attempt history: <task ID | observed result | route taken | evidence>
- Last observed result: <short evidence based summary>
- Next action: <exact skill invocation>
