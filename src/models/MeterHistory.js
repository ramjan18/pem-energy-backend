import mongoose from 'mongoose';

const meterHistorySchema = new mongoose.Schema({
  meter: { type: mongoose.Schema.Types.ObjectId, ref: 'Meter', required: true },
  oldMultiplier: { type: Number, required: true },
  newMultiplier: { type: Number, required: true },
  changedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByName: { type: String },
  comment: { type: String },
}, { timestamps: true });

meterHistorySchema.index({ meter: 1, createdAt: 1 });

export default mongoose.model('MeterHistory', meterHistorySchema);
