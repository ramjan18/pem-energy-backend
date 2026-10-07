import express from 'express';
import {
  recordMeterReading,
  getMeterReadings,
  calculateDailyConsumption,
  calculateActualMD,
  calculatePFMetricsForPeriod,
  recalculatePFForAllReadings,
  getMeterReadingById,
  updateMeterReading,
  deleteMeterReading,
  getDeletedMeterReadings,
  restoreMeterReading,
} from '../controllers/readingController.js';
import { protect, authorize, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// All reading routes require authentication
router.use(protect);

// Specific routes (must come before parameterized routes)
router.get('/deleted-readings', authorize('admin', 'manager'), (req, res, next) => req.user.role === 'manager' ? requirePermission('deleteRecords')(req, res, next) : next(), getDeletedMeterReadings);
router.post('/admin/recalculate-pf', authorize('manager', 'admin'), recalculatePFForAllReadings);
router.get('/daily-consumption', calculateDailyConsumption);
router.get('/actual-md', calculateActualMD);
router.get('/pf-metrics/period', calculatePFMetricsForPeriod);
router.get('/pf-metrics/period', calculatePFMetricsForPeriod);

// General routes
router.post('/', authorize('recorder', 'manager', 'admin'), (req, res, next) => req.user.role === 'manager' ? requirePermission('fillPending')(req, res, next) : next(), recordMeterReading);
router.get('/', getMeterReadings);

// Parameterized routes (must come last)
router.post('/:id/restore', authorize('manager', 'admin'), (req, res, next) => req.user.role === 'manager' ? requirePermission('deleteRecords')(req, res, next) : next(), restoreMeterReading);
router.get('/:id', getMeterReadingById);
router.put('/:id', authorize('manager', 'admin'), (req, res, next) => req.user.role === 'manager' ? requirePermission('editRecords')(req, res, next) : next(), updateMeterReading);
router.delete('/:id', authorize('manager', 'admin'), (req, res, next) => req.user.role === 'manager' ? requirePermission('deleteRecords')(req, res, next) : next(), deleteMeterReading);

export default router;
