import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Membership from '../models/Membership.js';

// Deliberately returns aggregate facts only; providers never receive raw documents.
export const buildAiWorkspaceContext = async ({ companyId, user, branchId }) => {
  const branchScoped = !['Owner', 'Admin'].includes(user.role) || Boolean(branchId);
  const scope = branchScoped && branchId ? { companyId, branchId } : { companyId };
  const [productCount, lowStockCount, salesCount, employeeCount] = await Promise.all([
    Product.countDocuments({ ...scope, isArchived: { $ne: true } }),
    Product.countDocuments({ ...scope, isArchived: { $ne: true }, status: 'Low Stock' }),
    Sale.countDocuments(scope),
    Membership.countDocuments({ companyId, status: 'active', ...(user.role === 'Owner' || user.role === 'Admin' ? {} : { branchId }) }),
  ]);
  return { organizationId: companyId, branchId: branchId || 'all-permitted-branches', role: user.role, permissions: user.permissions || [], productCount, lowStockCount, salesCount, employeeCount };
};
