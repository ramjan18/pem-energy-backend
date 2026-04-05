import express from 'express';
import {
  recordMeterReading,
  getMeterReadings,
  calculateDailyConsumption,
  calculateActualMD,
  getMeterReadingById,
  updateMeterReading,
  deleteMeterReading,
  getDeletedMeterReadings,
  restoreMeterReading,
} from '../controllers/readingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All reading routes require authentication
router.use(protect);

// Specific routes (must come before parameterized routes)
router.get('/deleted-readings', authorize('manager'), getDeletedMeterReadings);
router.get('/daily-consumption', calculateDailyConsumption);
router.get('/actual-md', calculateActualMD);

// General routes
router.post('/', authorize('recorder', 'manager'), recordMeterReading);
router.get('/', getMeterReadings);

// Parameterized routes (must come last)
router.post('/:id/restore', authorize('manager'), restoreMeterReading);
router.get('/:id', getMeterReadingById);
router.put('/:id', authorize('recorder', 'manager'), updateMeterReading);
router.delete('/:id', authorize('manager'), deleteMeterReading);

export default router;
