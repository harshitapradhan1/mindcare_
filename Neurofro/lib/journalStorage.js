/**
 * Local journal fallback when the API is unreachable (e.g. Vercel without a deployed backend).
 * Entries are stored in localStorage per user and merged with server entries on the journal page.
 */

const storageKey = (userId) => `mindcare_journal_local_${userId}`;

export function getLocalJournalEntries(userId) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendLocalJournalEntry(userId, entry) {
  if (typeof window === "undefined") return;
  const list = getLocalJournalEntries(userId);
  list.unshift(entry);
  window.localStorage.setItem(storageKey(userId), JSON.stringify(list));
}

export function removeLocalJournalEntry(userId, entryId) {
  if (typeof window === "undefined") return;
  const list = getLocalJournalEntries(userId).filter(
    (e) => e.entry_id !== entryId
  );
  window.localStorage.setItem(storageKey(userId), JSON.stringify(list));
}

export function mergeJournalEntries(serverEntries, userId) {
  const server = Array.isArray(serverEntries) ? serverEntries : [];
  const local = getLocalJournalEntries(userId);
  const seen = new Set(server.map((e) => e.entry_id));
  const merged = [...server];
  for (const e of local) {
    if (e?.entry_id && !seen.has(e.entry_id)) {
      merged.push(e);
      seen.add(e.entry_id);
    }
  }
  merged.sort(
    (a, b) =>
      new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  );
  return merged;
}
