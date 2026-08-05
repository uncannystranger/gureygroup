import mongoose from 'mongoose';
const employeeMemberSchema = new mongoose.Schema({
employeeId: { type: String, required: true, unique: true, index: true }, email: { type: String, required: true, lowercase: true, trim: true }, passwordHash: { type: String, required: true, select: false }, accountType: { type: String, enum: ['employee'], default: 'employee' }, displayName: { type: String, required: true }, photoURL: { type: String, default: '' }, companyId: { type: String, required: true, index: true }, organizationId: { type: String, required: true, index: true }, ownerId: { type: String, required: true, index: true }, role: { type: String, required: true, enum: ['Admin', 'Manager', 'Cashier', 'Inventory Staff', 'Employee'] }, permissions: [{ type: String }], securityPinHash: { type: String, default: '' }, status: { type: String, enum: ['active', 'suspended'], default: 'active' }, invitedBy: { type: String, required: true }, joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });
employeeMemberSchema.index({ companyId: 1, email: 1 }, { unique: true });
export default mongoose.models.EmployeeMember || mongoose.model('EmployeeMember', employeeMemberSchema);
