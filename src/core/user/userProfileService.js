/**
 * userProfileService.js
 *
 * Persistent user profile service using:
 *   - Firebase Realtime Database (RTDB) as the authoritative data store
 *     → https://saas1-e4054-default-rtdb.firebaseio.com/users/{uid}/profile
 *   - Firebase Storage for profile image hosting
 *     → profile-images/{uid}/avatar
 *
 * All operations are scoped to the authenticated user's UID.
 * No cross-user data access is possible.
 */

import {
  rtdb,
  storage,
  dbRef,
  get,
  set,
  update,
  storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from '../auth/firebase';

/**
 * Per-user localStorage cache key — scoped to UID so different
 * users on the same browser never see each other's cached data.
 */
export const getLocalCacheKey = (uid) => `gurey_user_profile_${uid}`;

/**
 * Load a user's profile from Firebase Realtime Database.
 * Returns the profile object or null if no record exists yet.
 *
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function loadUserProfile(uid) {
  if (!uid) return null;
  try {
    const snap = await get(dbRef(rtdb, `users/${uid}/profile`));
    if (snap.exists()) {
      return snap.val();
    }
    return null;
  } catch (err) {
    console.warn('[UserProfileService] RTDB load failed:', err.message);
    return null;
  }
}

/**
 * Save (merge) profile fields into Firebase Realtime Database.
 * Uses RTDB `update` so only the provided fields are written —
 * existing fields not included in `fields` are preserved.
 *
 * @param {string} uid
 * @param {object} fields
 * @returns {Promise<boolean>}
 */
export async function saveUserProfile(uid, fields) {
  if (!uid) return false;
  try {
    // Clean undefined values — RTDB rejects them
    const clean = {};
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null) clean[k] = v;
    });

    const payload = {
      ...clean,
      uid,
      updatedAt: new Date().toISOString()
    };

    await update(dbRef(rtdb, `users/${uid}/profile`), payload);
    return true;
  } catch (err) {
    console.warn('[UserProfileService] RTDB save failed:', err.message);
    return false;
  }
}

/**
 * Upload a profile image to Firebase Storage.
 *
 * Path: profile-images/{uid}/avatar  (deterministic — one file per user)
 * Before uploading, attempts to delete the file at the same path so
 * orphaned images never accumulate in Storage.
 *
 * Accepts:
 *   - A File object (from file input / drag-drop)
 *   - A base64 data URI string (from FileReader / canvas crop / camera)
 *
 * Returns the permanent public download URL.
 *
 * @param {string} uid
 * @param {File|string} imageInput
 * @returns {Promise<string>} download URL
 */
export async function uploadProfileImage(uid, imageInput) {
  if (!uid || !imageInput) throw new Error('UID and image input are required.');

  const path = `profile-images/${uid}/avatar`;
  const imgRef = storageRef(storage, path);

  // Delete previous image at this path (orphan prevention)
  try {
    await deleteObject(imgRef);
  } catch {
    // No prior image — safe to ignore
  }

  let blob;
  let mimeType = 'image/jpeg';

  if (imageInput instanceof File) {
    blob = imageInput;
    mimeType = imageInput.type || 'image/jpeg';
  } else if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
    // Extract mime type from data URI header
    const mimeMatch = imageInput.match(/^data:([^;]+);/);
    if (mimeMatch) mimeType = mimeMatch[1];
    const res = await fetch(imageInput);
    blob = await res.blob();
  } else {
    throw new Error('Invalid image: must be a File or a data: URI.');
  }

  await uploadBytes(imgRef, blob, {
    contentType: mimeType,
    customMetadata: { uid, uploadedAt: new Date().toISOString() }
  });

  const downloadURL = await getDownloadURL(imgRef);
  return downloadURL;
}

/**
 * Remove a user's profile image from Storage and clear photoURL in RTDB.
 *
 * @param {string} uid
 * @param {string} fallbackUrl
 * @returns {Promise<string>} fallback URL
 */
export async function removeProfileImage(uid, fallbackUrl) {
  if (!uid) return fallbackUrl;
  try {
    await deleteObject(storageRef(storage, `profile-images/${uid}/avatar`));
  } catch {
    // May not exist — fine
  }
  await saveUserProfile(uid, { photoURL: fallbackUrl || '' });
  return fallbackUrl;
}
