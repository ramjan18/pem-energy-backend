import express from 'express';
import Meter from '../models/Meter.js';
import User from '../models/User.js';
import MeterReading from '../models/MeterReading.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PEM Energy Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Database diagnostics endpoint
router.get('/diagnostics', async (req, res) => {
  try {
    // Count documents
    const meterCount = await Meter.countDocuments();
    const userCount = await User.countDocuments();
    const readingCount = await MeterReading.countDocuments();

    // Find orphaned readings
    const allReadings = await MeterReading.find()
      .populate('meter', null, null, { strictPopulate: false })
      .populate('recordedBy', null, null, { strictPopulate: false });

    const orphanedReadings = allReadings.filter(r => !r.meter || !r.recordedBy);

    // Get all meters
    const allMeters = await Meter.find().select('_id meterName meterNumber');

    // Get recent readings
    const recentReadings = await MeterReading.find()
      .limit(5)
      .populate('meter', 'meterName meterNumber')
      .populate('recordedBy', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        meterCount,
        userCount,
        readingCount,
        orphanedReadingsCount: orphanedReadings.length,
        meters: allMeters,
      },
      issues: {
        orphanedReadings: orphanedReadings.length > 0 ? orphanedReadings.map(r => ({
          _id: r._id,
          meter: r.meter?._id || 'MISSING',
          recordedBy: r.recordedBy?._id || 'MISSING',
          shift: r.shift,
          date: r.readingDate,
        })) : [],
      },
      recentReadings: recentReadings.map(r => ({
        _id: r._id,
        meter: r.meter?.meterName || 'MISSING',
        shift: r.shift,
        kwh: r.KWH,
        kvah: r.KVAH,
        recordedBy: r.recordedBy?.username || 'MISSING',
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Diagnostic error',
      error: error.message,
    });
  }
});

export default router;
