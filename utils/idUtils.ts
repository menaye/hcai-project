/**
 * Simple ID generation utilities
 */

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateStepId(taskId: string, order: number): string {
  return `${taskId}-step-${order}`;
}
