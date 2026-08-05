import mongoose from 'mongoose';

const migrationSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  appliedAt: { type: Date, default: Date.now },
}, { collection: '_schema_migrations' });

export default mongoose.models.SchemaMigration || mongoose.model('SchemaMigration', migrationSchema);
