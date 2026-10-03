export function issue(code, message, context = {}, severity = 'error') {
  return { severity, code, ...context, message };
}
export class PricingError extends Error {
  constructor(code, message, context = {}) {
    super(message);
    this.issue = issue(code, message, context);
  }
}
export function fail(code, message, context) { throw new PricingError(code, message, context); }
