  import Meter from '../models/Meter.js';
  import MeterHistory from '../models/MeterHistory.js';

  export const createMeter = async (req, res, next) => {
    try {
      const {
        meterName,
        meterType,
        meterNumber,
        location,
        department,
        multiplier,
        contractedMD,
        notes,
      } = req.body;

      if (!meterName || !meterType || !meterNumber || !location) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      const meter = new Meter({
        meterName,
        meterType,
        meterNumber,
        location,
        department,
        multiplier: multiplier ?? (meterName === 'SMRT' ? 10 : meterName === 'SAPL' ? 70 : meterName === 'SMC-HT' ? 4 : 1),
        contractedMD: contractedMD || 0,
        notes,
      });

      await meter.save();

      res.status(201).json({
        success: true,
        message: 'Meter created successfully',
        data: meter,
      });
    } catch (error) {
      next(error);
    }
  };

  export const getAllMeters = async (req, res, next) => {
    try {
      const { isActive, department, meterName } = req.query;
      const filter = {};

      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (department) filter.department = department;
      if (meterName) filter.meterName = meterName;

      const meters = await Meter.find(filter).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: meters.length,
        data: meters,
      });
    } catch (error) {
      next(error);
    }
  };

  export const getMeterById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const meter = await Meter.findById(id);

      if (!meter) {
        return res.status(404).json({
          success: false,
          message: 'Meter not found',
        });
      }

      res.status(200).json({
        success: true,
        data: meter,
      });
    } catch (error) {
      next(error);
    }
  };

  export const updateMeter = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const meterBefore = await Meter.findById(id);
      if (!meterBefore) {
        return res.status(404).json({ success: false, message: 'Meter not found' });
      }

      // If multiplier is being changed, require comment >= 15 chars
      if (updates.multiplier !== undefined && updates.multiplier !== meterBefore.multiplier) {
        if (!Number.isFinite(Number(updates.multiplier)) || Number(updates.multiplier) <= 0) {
          return res.status(400).json({ success: false, message: 'Multiplier must be greater than zero' });
        }
        const comment = updates.comment || updates.multiplierComment || '';
        if (typeof comment !== 'string' || comment.trim().length < 15) {
          return res.status(400).json({ success: false, message: 'Please provide a comment of at least 15 characters when changing multiplier' });
        }
      }

      const { comment, multiplierComment, ...meterUpdates } = updates;
      const multiplierChanged = meterUpdates.multiplier !== undefined && Number(meterUpdates.multiplier) !== meterBefore.multiplier;
      const changedAt = new Date();
      const meter = await Meter.findByIdAndUpdate(id, meterUpdates, {
        new: true,
        runValidators: true,
      });

      if (!meter) {
        return res.status(404).json({
          success: false,
          message: 'Meter not found',
        });
      }

      if (multiplierChanged) {
        try {
          await MeterHistory.create({
            meter: meter._id,
            oldMultiplier: meterBefore.multiplier,
            newMultiplier: meter.multiplier,
            changedById: req.user?._id || req.user?.id || undefined,
            changedByName: req.user?.username || req.user?.name || undefined,
            comment: String(comment || multiplierComment || '').trim(),
            createdAt: changedAt,
            updatedAt: changedAt,
          });
        } catch (historyError) {
          await Meter.findByIdAndUpdate(id, { multiplier: meterBefore.multiplier });
          throw historyError;
        }
      }

      res.status(200).json({
        success: true,
        message: 'Meter updated successfully',
        data: meter,
      });
    } catch (error) {
      next(error);
    }
  };

  export const getMeterHistory = async (req, res, next) => {
    try {
      const { id } = req.params;
      const histories = await MeterHistory.find({ meter: id }).sort({ createdAt: -1 }).lean();
      res.status(200).json({ success: true, count: histories.length, data: histories });
    } catch (error) {
      next(error);
    }
  };

  export const deleteMeter = async (req, res, next) => {
    try {
      const { id } = req.params;

      const meter = await Meter.findByIdAndDelete(id);
      if (!meter) {
        return res.status(404).json({
          success: false,
          message: 'Meter not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Meter deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
