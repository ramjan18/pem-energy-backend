import express from 'express';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PEM Energy Backend is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
