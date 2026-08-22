import Company from '../models/Company.js';
import Organization from '../models/Organization.js';

/**
 * A workspace is currently spread across two overlapping collections:
 * `Company` (the original model) and `Organization` (the richer one used by
 * settings and onboarding). Routes previously picked whichever they happened
 * to prefer, so the same workspace reported different settings — most visibly
 * a different tax rate — depending on how the user signed in.
 *
 * Every route now resolves the workspace through here, with Organization as
 * the authority and Company filling only the fields it does not carry.
 */
export const resolveWorkspace = async (companyId, options = {}) => {
  if (!companyId) return null;
  const session = options.session;

  const query = (model) => {
    const q = model.findOne({ companyId });
    return session ? q.session(session) : q;
  };

  const [organization, company] = await Promise.all([
    query(Organization),
    query(Company),
  ]);

  if (!organization && !company) return null;

  const org = organization?.toObject?.() || organization || {};
  const legacy = company?.toObject?.() || company || {};

  const settings = {
    lowStockThreshold: org.settings?.lowStockThreshold ?? legacy.settings?.lowStockThreshold ?? 10,
    enableTax: org.settings?.enableTax ?? legacy.settings?.enableTax ?? true,
    defaultTaxRate: org.settings?.defaultTaxRate ?? legacy.settings?.defaultTaxRate ?? 0,
    currencySymbol: org.currencySymbol || legacy.settings?.currencySymbol || '$',
    merchantNumber: org.settings?.merchantNumber ?? '',
    receipt: {
      showCashierName: org.settings?.receipt?.showCashierName ?? true,
      showEmployeeId: org.settings?.receipt?.showEmployeeId ?? false,
      showBranch: org.settings?.receipt?.showBranch ?? true,
      showCashierRole: org.settings?.receipt?.showCashierRole ?? false,
    },
  };

  return {
    ...legacy,
    ...org,
    companyId,
    id: companyId,
    name: org.name || legacy.name || 'Organization',
    logo: org.logo || legacy.logo || '',
    ownerId: org.ownerId || legacy.ownerUid || '',
    ownerEmail: org.ownerEmail || legacy.ownerEmail || '',
    currency: org.currency || legacy.currency || 'USD',
    currencySymbol: settings.currencySymbol,
    timezone: org.timezone || legacy.timezone || 'UTC',
    subscriptionTier: legacy.subscriptionTier || org.subscription?.plan || 'Enterprise',
    settings,
    taxRate: settings.defaultTaxRate,
    merchantNumber: settings.merchantNumber,
    receiptSettings: settings.receipt,
  };
};
