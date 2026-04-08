import mongoose from 'mongoose';

const meterReadingSchema = new mongoose.Schema(
  {
    meter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meter',
      required: [true, 'Meter reference is required'],
    },
    readingDate: {
      type: Date,
      required: [true, 'Reading date is required'],
    },
    shift: {
      type: String,
      required: [true, 'Shift is required'],
      enum: ['1', '2', '3'],
    },
    KWH: {
      type: Number,
      required: [true, 'KWH reading is required'],
      min: [0, 'KWH cannot be negative'],
    },
    KVAH: {
      type: Number,
      required: [true, 'KVAH reading is required'],
      min: [0, 'KVAH cannot be negative'],
    },
    KVARH: {
      type: Number,
      default: 0,
      min: [0, 'KVARH cannot be negative'],
    },
    KVARHlag: {
      type: Number,
      required: [true, 'KVARH Lag is required'],
      min: [0, 'KVARH Lag cannot be negative'],
    },
    KVARHlead: {
      type: Number,
      required: [true, 'KVARH Lead is required'],
      min: [0, 'KVARH Lead cannot be negative'],
    },
    MD: {
      type: Number,
      required: [true, 'MD reading is required'],
      min: [0, 'MD cannot be negative'],
    },
    PF: {
      type: Number,
      default: null,
      min: [0, 'PF must be between 0 and 1'],
      max: [1, 'PF must be between 0 and 1'],
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: String,
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('MeterReading', meterReadingSchema);
