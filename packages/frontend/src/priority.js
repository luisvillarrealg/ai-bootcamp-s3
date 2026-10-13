export const PRIORITIES = ['P1', 'P2', 'P3'];
export const DEFAULT_PRIORITY = 'P3';

export const normalizePriority = (priority) =>
  PRIORITIES.includes(priority) ? priority : DEFAULT_PRIORITY;
