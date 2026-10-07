import mongoose from 'mongoose';

const meterSchema = new mongoose.Schema(
  {
    meterName: {
      type: String,
      required: [true, 'Meter name is required'],
      enum: ['SAPL', 'SMRT', 'SMC-HT'],
    },
    meterType: {
      type: String,
      enum: ['Single Phase', 'Three Phase'],
      required: true,
    },
    meterNumber: {
      type: String,
      required: [true, 'Meter number is required'],
      unique: true,
    },
    location: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: 'General',
    },
    installationDate: {
      type: Date,
      default: Date.now,
    },
    multiplier: {
      type: Number,
      default: function () {
        return { SAPL: 70, SMRT: 10, 'SMC-HT': 4 }[this.meterName] || 1;
      },
      required: true,
    },
    contractedMD: {
      type: Number,
      default: 0,
      description: 'Contracted Maximum Demand in kW',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Meter', meterSchema);
