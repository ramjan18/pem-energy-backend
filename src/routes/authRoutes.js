import express from 'express';
import {
  register,
  login,
  getProfile,
  getAllUsers,
  updateUser,
  deleteUser,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);
router.get('/users', protect, authorize('manager'), getAllUsers);
router.put('/users/:id', protect, updateUser);
router.delete('/users/:id', protect, authorize('manager'), deleteUser);

export default router;
