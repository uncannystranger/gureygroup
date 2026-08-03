import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  userId:       { type: String, required: true, index: true },
  userName:     { type: String, default: '' },
  userRole:     { type: String, default: '' },
  companyId:    { type: String, required: true, index: true },
  branchId:     { type: String, default: null },
  date:         { type: String, required: true },             // YYYY-MM-DD format for easy querying
  checkIn:      { type: Date, default: null },
  checkOut:     { type: Date, default: null },
  workingHours: { type: Number, default: 0 },                 // In minutes
  status:       { type: String, enum: ['present', 'late', 'absent', 'half-day', 'leave'], default: 'present' },
  notes:        { type: String, default: '' },
}, {
  timestamps: true,
});

attendanceSchema.index({ companyId: 1, date: 1 });
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ companyId: 1, branchId: 1, date: 1 });

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
