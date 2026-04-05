import express from 'express';
import {
  createMeter,
  getAllMeters,
  getMeterById,
  updateMeter,
  deleteMeter,
} from '../controllers/meterController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All meter routes require authentication
router.use(protect);

router.post('/', authorize('manager'), createMeter);
router.get('/', getAllMeters);
router.get('/:id', getMeterById);
router.put('/:id', authorize('manager'), updateMeter);
router.delete('/:id', authorize('manager'), deleteMeter);

export default router;
