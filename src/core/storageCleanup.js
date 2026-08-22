/**
 * One-time removal of browser-held business data.
 *
 * Suppliers, purchase orders, stock history, customers, employees, the local
 * account registry and the legacy profile blob were previously persisted in
 * localStorage. They are now read from the API, so any copies still sitting in
 * a browser are stale, unverifiable, and must not be able to reappear.
 *
 * Device-scoped state is deliberately left alone: theme, language, accent,
 * the selected branch, the auth token, and parked POS carts (which belong to
 * one terminal, not the workspace).
 */
const LEGACY_EXACT_KEYS = [
  'gurey_registered_accounts',
  'gurey_user_profile',
  'gurey_merchant_number',
  'gurey_receipt_settings',
];

const LEGACY_PREFIXES = [
  'gurey_suppliers_',
  'gurey_purchase_orders_',
  'gurey_stock_adjustments_',
  'gurey_customers_',
  'gurey_employees_',
  'gurey_activities_',
];

const CLEANUP_FLAG = 'gurey_storage_migrated_v2';

export function purgeLegacyClientStores() {
  try {
    if (localStorage.getItem(CLEANUP_FLAG)) return 0;

    const doomed = Object.keys(localStorage).filter((key) =>
      LEGACY_EXACT_KEYS.includes(key) || LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix))
    );
    doomed.forEach((key) => localStorage.removeItem(key));

    localStorage.setItem(CLEANUP_FLAG, new Date().toISOString());
    if (doomed.length > 0) {
      console.info(`[Gurey Group] Removed ${doomed.length} legacy client-side record store(s); this data now lives in the database.`);
    }
    return doomed.length;
  } catch {
    return 0;
  }
}
