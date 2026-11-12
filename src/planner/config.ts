/**
 * Google Apps Script web app that stores planner answers.
 * This is a public deployment URL, not a secret.
 */
export const PLANNER_API_URL =
  'https://script.google.com/macros/s/AKfycbweDhJdOC9RAn3TFy2G9ez4W0vyaMWF4MyNoyyE3KZvxLd0M8mZD-58X9ez9PqEf45GDQ/exec'

/** Apex site. Planner links always use this, not whatever host opened the pipeline. */
export const SITE_ORIGIN = 'https://andershyattmusic.com'

/** Couple planner URL: https://andershyattmusic.com/planner/?c=TOKEN */
export function plannerLink(token: string, fromPipeline = false): string {
  const url = new URL('/planner/', SITE_ORIGIN)
  url.searchParams.set('c', token)
  if (fromPipeline) url.searchParams.set('from', 'pipeline')
  return url.toString()
}
