const STORAGE_KEY = 'realist:browse-leads';

export function loadBrowseLeadsSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.leads) || !data.leads.length) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveBrowseLeadsSession(payload) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function clearBrowseLeadsSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
