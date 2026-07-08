/** User-friendly hint when PropertyRadar API rejects the request */
export function formatPropertyRadarError(message = '') {
  const text = String(message);
  if (/Unexpected Criterion/i.test(text)) {
    return `${text} — Invalid search filter sent to PropertyRadar. Try again after backend is updated.`;
  }
  if (/access_denied|integrations feature|free trial/i.test(text)) {
    return `${text} — PropertyRadar account par Integrations/API subscription activate karein: Account Settings → Integrations → "Add additional integrations".`;
  }
  return text;
}
