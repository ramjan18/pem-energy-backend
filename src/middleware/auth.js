import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token, access denied',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid',
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized for this action`,
      });
    }

    next();
  };
};

export const requirePermission = (permission) => async (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  try {
    const user = await User.findById(req.user?.id).select('permissions');
    if (user?.permissions?.includes('*') || user?.permissions?.includes(permission)) return next();
    return res.status(403).json({ success: false, message: `Permission required: ${permission}` });
  } catch (error) { return next(error); }
};
