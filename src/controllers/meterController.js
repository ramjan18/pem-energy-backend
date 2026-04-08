  import Meter from '../models/Meter.js';

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
        multiplier: multiplier || 1,
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

      const meter = await Meter.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (!meter) {
        return res.status(404).json({
          success: false,
          message: 'Meter not found',
        });
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
