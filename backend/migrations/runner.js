import Migration from './Migration.js';
import Branch from '../models/Branch.js';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';

// Additive, idempotent migrations only. No reset/drop/delete operations belong here.
export async function runMigrations() {
  const name = '2026-08-05-branch-isolation';
  if (await Migration.exists({ name })) return;

  const branches = await Branch.find({ status: 'active' }).select('_id companyId').lean();
  const defaultBranchByCompany = new Map();
  for (const branch of branches) {
    if (!defaultBranchByCompany.has(branch.companyId)) defaultBranchByCompany.set(branch.companyId, String(branch._id));
  }

  // Preserve legacy records by assigning only documents that lack a branch.
  for (const [companyId, branchId] of defaultBranchByCompany) {
    await Product.updateMany({ companyId, $or: [{ branchId: { $exists: false } }, { branchId: null }] }, { $set: { branchId } });
    await Sale.updateMany({ companyId, $or: [{ branchId: { $exists: false } }, { branchId: null }] }, { $set: { branchId } });
  }

  // Replace old tenant-only sale indexes with branch-aware equivalents.
  const collection = Sale.collection;
  for (const indexName of ['companyId_1_invoiceNumber_1', 'companyId_1_receiptNumber_1', 'companyId_1_createdAt_-1']) {
    try { await collection.dropIndex(indexName); } catch (error) {
      if (error.codeName !== 'IndexNotFound') throw error;
    }
  }
  await Sale.syncIndexes();
  await Migration.create({ name });
  console.log(`[Migrations] Applied ${name}; existing records preserved.`);
}
