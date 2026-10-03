export function report(command, issues = [], details = {}) {
  const summary = { info: 0, warning: 0, error: 0 };
  for (const item of issues) summary[item.severity]++;
  return { schemaVersion: 1, command, status: summary.error ? 'failed' : 'passed', summary, issues, ...details };
}
