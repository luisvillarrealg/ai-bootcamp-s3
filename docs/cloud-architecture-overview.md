# Cloud Architecture Overview

## Current Architecture

The TODO app is an npm-workspaces monorepo with a React frontend and an Express API. The frontend sends JSON requests to relative `/api/tasks` routes, which the development proxy forwards to the Express server on port `3030`. The API stores tasks in an in-memory SQLite database created with `better-sqlite3`.

The current architecture has no managed cloud services. The data store exists only inside the API process, so all task data is lost when that process restarts.

## System Context

```mermaid
flowchart LR
    user[TODO App User]

    subgraph monorepo[TODO App Monorepo]
        frontend[React Frontend<br/>Material UI]
        api[Express API<br/>Node.js :3030]
        store[(In-Memory SQLite<br/>Task Store)]

        frontend -->|HTTP JSON<br/>/api/tasks| api
        api -->|SQL queries| store
    end

    user -->|Uses web browser| frontend
```

## Sequence: User Creating a TODO

```mermaid
sequenceDiagram
    title User Creates a TODO
    actor User
    participant Form as React TaskForm
    participant App as React App
    participant API as Express API
    participant DB as In-Memory SQLite
    participant List as React TaskList

    User->>Form: Enter task details and submit
    Form->>Form: Validate required title
    Form->>App: onSave(task)
    App->>API: POST /api/tasks (JSON)
    API->>API: Validate title
    API->>DB: INSERT task
    DB-->>API: New task ID
    API->>DB: SELECT inserted task
    DB-->>API: Created task
    API-->>App: 201 Created (task JSON)
    App->>List: Increment refresh key and remount
    List->>API: GET /api/tasks
    API->>DB: SELECT tasks ordered by due date
    DB-->>API: Task collection
    API-->>List: 200 OK (task collection)
    List-->>User: Display refreshed task list
```

## Runtime Notes

- The root `npm run start` command starts the frontend and backend concurrently.
- The frontend uses the relative `/api/tasks` path and proxies development requests to `http://localhost:3030`.
- Express provides task create, read, update, completion-toggle, and delete endpoints.
- SQLite runs with the `:memory:` connection string; it is not durable or shared across API instances.