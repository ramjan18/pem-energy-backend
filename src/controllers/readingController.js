import MeterReading from '../models/MeterReading.js';
import Meter from '../models/Meter.js';

export const recordMeterReading = async (req, res, next) => {
  try {
    const {
      meterId,
      readingDate,
      shift,
      KWH,
      KVAH,
      KVARHlag,
      KVARHlead,
      MD,
      PF,
      notes,
    } = req.body;

    // Validate required fields
    if (!meterId || !readingDate || !shift || KWH === undefined || KVAH === undefined || KVARHlag === undefined || KVARHlead === undefined || MD === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: meterId, readingDate, shift, KWH, KVAH, KVARHlag, KVARHlead, MD',
      });
    }

    // Validate data types and ranges
    if (typeof KWH !== 'number' || KWH < 0) {
      return res.status(400).json({
        success: false,
        message: 'KWH must be a positive number',
      });
    }

    if (typeof KVAH !== 'number' || KVAH < 0) {
      return res.status(400).json({
        success: false,
        message: 'KVAH must be a positive number',
      });
    }

    if (typeof KVARHlag !== 'number' || KVARHlag < 0) {
      return res.status(400).json({
        success: false,
        message: 'KVARH Lag must be a valid non-negative number',
      });
    }

    if (typeof KVARHlead !== 'number' || KVARHlead < 0) {
      return res.status(400).json({
        success: false,
        message: 'KVARH Lead must be a valid non-negative number',
      });
    }

    if (typeof MD !== 'number' || MD < 0) {
      return res.status(400).json({
        success: false,
        message: 'MD must be a positive number',
      });
    }

    if (PF !== undefined && PF !== null && (typeof PF !== 'number' || PF < 0 || PF > 1)) {
      return res.status(400).json({
        success: false,
        message: 'PF must be a number between 0 and 1',
      });
    }

    if (!['1', '2', '3'].includes(shift)) {
      return res.status(400).json({
        success: false,
        message: 'Shift must be 1, 2, or 3',
      });
    }

    // Validate reading date
    const readingDateObj = new Date(readingDate);
    if (isNaN(readingDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reading date format',
      });
    }

    // Verify meter exists
    const meter = await Meter.findById(meterId);
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found',
      });
    }

    // Prevent duplicate readings for the same meter/shift within 18 hours
    const lockWindow = new Date(Date.now() - 18 * 60 * 60 * 1000);
    const existing = await MeterReading.findOne({
      meter: meterId,
      shift,
      deletedAt: null,
      createdAt: { $gte: lockWindow },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A reading already exists for this meter and shift. You can re-enter only after 18 hours or if the existing reading is deleted.',
      });
    }

    const totalKVARH = KVARHlag + KVARHlead;
    const reading = new MeterReading({
      meter: meterId,
      readingDate,
      shift,
      KWH,
      KVAH,
      KVARH: totalKVARH,
      KVARHlag,
      KVARHlead,
      MD,
      PF: PF === undefined ? null : PF,
      recordedBy: req.user.id,
      notes,
    });

    await reading.save();
    await reading.populate('meter recordedBy', 'meterName meterNumber username');

    res.status(201).json({
      success: true,
      message: 'Meter reading recorded successfully',
      data: reading,
    });
  } catch (error) {
    next(error);
  }
};

export const getMeterReadings = async (req, res, next) => {
  try {
    const { meterId, shift, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { deletedAt: null };
    if (meterId) filter.meter = meterId;
    if (shift) filter.shift = shift;

    if (startDate || endDate) {
      filter.readingDate = {};
      if (startDate) filter.readingDate.$gte = new Date(startDate);
      if (endDate) filter.readingDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const readings = await MeterReading.find(filter)
      .populate('meter recordedBy', 'meterName meterNumber username')
      .sort({ readingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MeterReading.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: readings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const calculateDailyConsumption = async (req, res, next) => {
  try {
    const { meterId, date } = req.query;

    if (!meterId || !date) {
      return res.status(400).json({
        success: false,
        message: 'meterId and date are required',
      });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const reading = await MeterReading.findOne({
      meter: meterId,
      readingDate: {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate('meter');

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'No reading found for the specified date',
      });
    }

    const meter = reading.meter;
    const dailyConsumption = reading.KWH * meter.multiplier;

    res.status(200).json({
      success: true,
      data: {
        meter: {
          name: meter.meterName,
          number: meter.meterNumber,
          multiplier: meter.multiplier,
        },
        date,
        kwhReading: reading.KWH,
        dailyConsumptionKWH: dailyConsumption,
        kvahReading: reading.KVAH,
        kvarhReading: reading.KVARH,
        md: reading.MD,
        pf: reading.PF,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const calculateActualMD = async (req, res, next) => {
  try {
    const { meterId, startDate, endDate } = req.query;

    if (!meterId) {
      return res.status(400).json({
        success: false,
        message: 'meterId is required',
      });
    }

    const filter = { meter: meterId };

    if (startDate || endDate) {
      filter.readingDate = {};
      if (startDate) filter.readingDate.$gte = new Date(startDate);
      if (endDate) filter.readingDate.$lte = new Date(endDate);
    }

    const readings = await MeterReading.find(filter).populate('meter');

    if (readings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No readings found for the specified period',
      });
    }

    const mdValues = readings.map((r) => r.MD);
    const actualMD = Math.max(...mdValues);
    const avgMD = mdValues.reduce((a, b) => a + b, 0) / mdValues.length;

    const meter = readings[0].meter;
    const contractedMD = meter.contractedMD;

    res.status(200).json({
      success: true,
      data: {
        meter: {
          name: meter.meterName,
          number: meter.meterNumber,
          contractedMD,
        },
        period: {
          start: startDate || 'N/A',
          end: endDate || 'N/A',
        },
        readingsCount: readings.length,
        actualMD: Math.round(actualMD * 100) / 100,
        averageMD: Math.round(avgMD * 100) / 100,
        mdExceeded: actualMD > contractedMD,
        exceedancePercentage: contractedMD > 0 
          ? Math.round(((actualMD - contractedMD) / contractedMD) * 100)
          : 'N/A',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMeterReadingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found',
      });
    }

    const reading = await MeterReading.findById(id).populate('meter recordedBy');

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found',
      });
    }

    res.status(200).json({
      success: true,
      data: reading,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMeterReading = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found',
      });
    }

    const updates = req.body;

    // Validate numeric fields if provided
    if (updates.KWH !== undefined && (typeof updates.KWH !== 'number' || updates.KWH < 0)) {
      return res.status(400).json({
        success: false,
        message: 'KWH must be a positive number',
      });
    }

    if (updates.KVAH !== undefined && (typeof updates.KVAH !== 'number' || updates.KVAH < 0)) {
      return res.status(400).json({
        success: false,
        message: 'KVAH must be a positive number',
      });
    }

    if (updates.KVARH !== undefined && typeof updates.KVARH !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'KVARH must be a valid number',
      });
    }

    if (updates.KVARHlag !== undefined && (typeof updates.KVARHlag !== 'number' || updates.KVARHlag < 0)) {
      return res.status(400).json({
        success: false,
        message: 'KVARH Lag must be a valid non-negative number',
      });
    }

    if (updates.KVARHlead !== undefined && (typeof updates.KVARHlead !== 'number' || updates.KVARHlead < 0)) {
      return res.status(400).json({
        success: false,
        message: 'KVARH Lead must be a valid non-negative number',
      });
    }

    if (updates.MD !== undefined && (typeof updates.MD !== 'number' || updates.MD < 0)) {
      return res.status(400).json({
        success: false,
        message: 'MD must be a positive number',
      });
    }

    if (updates.PF !== undefined && updates.PF !== null && (typeof updates.PF !== 'number' || updates.PF < 0 || updates.PF > 1)) {
      return res.status(400).json({
        success: false,
        message: 'PF must be a number between 0 and 1',
      });
    }

    if (updates.shift !== undefined && !['1', '2', '3'].includes(updates.shift)) {
      return res.status(400).json({
        success: false,
        message: 'Shift must be 1, 2, or 3',
      });
    }

    if (updates.KVARHlag !== undefined || updates.KVARHlead !== undefined) {
      const lag = updates.KVARHlag !== undefined ? updates.KVARHlag : 0;
      const lead = updates.KVARHlead !== undefined ? updates.KVARHlead : 0;
      updates.KVARH = lag + lead;
    }

    const reading = await MeterReading.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('meter recordedBy');

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reading updated successfully',
      data: reading,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMeterReading = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found',
      });
    }

    const { deletionReason } = req.body;

    if (!deletionReason || deletionReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Deletion reason must be at least 10 characters',
      });
    }

    const reading = await MeterReading.findByIdAndUpdate(
      id,
      {
        deletedAt: new Date(),
        deletedBy: req.user.id,
        deletionReason,
      },
      { new: true }
    ).populate('meter deletedBy');

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reading deleted successfully',
      data: reading,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeletedMeterReadings = async (req, res, next) => {
  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { deletedAt: { $ne: null } };

    if (startDate || endDate) {
      filter.deletedAt = {};
      if (startDate) filter.deletedAt.$gte = new Date(startDate);
      if (endDate) filter.deletedAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const readings = await MeterReading.find(filter)
      .populate('meter recordedBy deletedBy', 'meterName meterNumber username')
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MeterReading.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: readings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const restoreMeterReading = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({
        success: false,
        message: 'Deleted reading not found',
      });
    }

    const reading = await MeterReading.findByIdAndUpdate(
      id,
      {
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
      },
      { new: true }
    ).populate('meter recordedBy');

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Deleted reading not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reading restored successfully',
      data: reading,
    });
  } catch (error) {
    next(error);
  }
};
