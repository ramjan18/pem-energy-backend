import express from 'express';
import {
  register,
  login,
  getProfile,
  getAllUsers,
  updateUser,
  deleteUser,
  updateUserPermissions,
} from '../controllers/authController.js';
import { protect, authorize, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);
router.post('/register', protect, authorize('manager', 'admin'), (req, res, next) => req.user.role === 'manager' ? requirePermission('createUsers')(req, res, next) : next(), register);
router.get('/users', protect, authorize('manager', 'admin'), getAllUsers);
router.put('/users/:id/permissions', protect, authorize('admin'), updateUserPermissions);
router.put('/users/:id', protect, updateUser);
router.delete('/users/:id', protect, authorize('manager', 'admin'), deleteUser);

export default router;
