/**
 * userProfileService.js
 *
 * Local cache helpers for the signed-in user's profile.
 *
 * Profiles used to be mirrored into the Firebase Realtime Database and avatars
 * into Firebase Storage, alongside the record the API already kept. Two stores
 * for one thing meant they disagreed — most visibly when a Storage upload
 * failed and a raw base64 data URI was written as the "permanent" photo URL.
 *
 * The API (backed by MongoDB) is now the single source of truth:
 *   - profile fields  → PATCH /api/auth/profile
 *   - avatar bytes    → POST  /api/uploads  (referenced by URL)
 *
 * What remains here is a per-user localStorage cache used purely to paint the
 * last known profile instantly on load. It is a cache, never the authority —
 * the API response always replaces it.
 */

/**
 * Per-user cache key — scoped to UID so different users on the same browser
 * never see each other's cached data.
 */
export function getLocalCacheKey(uid) {
  return `gurey_profile_cache_${uid}`;
}

export function readCachedProfile(uid) {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(getLocalCacheKey(uid));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCachedProfile(uid, profile) {
  if (!uid) return;
  try {
    localStorage.setItem(getLocalCacheKey(uid), JSON.stringify(profile));
  } catch {
    /* quota exceeded or storage disabled — the API still holds the truth */
  }
}

export function clearCachedProfile(uid) {
  if (!uid) return;
  try {
    localStorage.removeItem(getLocalCacheKey(uid));
  } catch { /* ignore */ }
}
