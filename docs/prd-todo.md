# Product Requirements Document (PRD) - TODO App Upgrade

## 1. Overview

The TODO app will be upgraded from a basic title-and-completion task list to a more practical task-management experience. The upgrade will let users assign optional due dates and priority levels and quickly filter tasks by date status. The MVP will remain simple and teachable, use local storage, and require no backend changes.

---

## 2. MVP Scope

- Retain the required task `title` field and existing completion state.
- Add an optional `dueDate` field using the ISO `YYYY-MM-DD` format.
- Ignore invalid `dueDate` values and treat them as absent.
- Add a `priority` field with the allowed values `P1`, `P2`, and `P3`.
- Default `priority` to `P3` when no priority is selected.
- Provide three task filters:
  - **All**: show all tasks, including completed tasks.
  - **Today**: show only incomplete tasks due today.
  - **Overdue**: show only incomplete tasks with a due date before today.
- Display priorities as color-coded badges: red for `P1`, orange for `P2`, and gray for `P3`.
- Continue to store task data locally with no backend or external storage changes.

---

## 3. Post-MVP Scope

- Visually highlight overdue tasks so they stand out, using red as proposed in the requirements meeting.
- Sort tasks in this order:
  1. Overdue tasks first.
  2. Priority from `P1` to `P3`.
  3. Due date in ascending order.
  4. Tasks without a due date last.

---

## 4. Out of Scope

- Notifications.
- Recurring tasks.
- Multi-user support.
- Keyboard navigation or other special accessibility features.
- Backend changes.
- External storage; task data will remain local only.