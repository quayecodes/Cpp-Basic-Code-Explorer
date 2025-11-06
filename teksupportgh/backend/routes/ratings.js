import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// Submit rating
router.post('/',
  authenticateToken,
  [
    body('request_id').isInt(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('review').optional().isLength({ max: 500 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { request_id, rating, review } = req.body;

      const requestResult = await query(
        'SELECT * FROM service_requests WHERE id = $1',
        [request_id]
      );

      if (requestResult.rows.length === 0) {
        return res.status(404).json({ error: 'Service request not found' });
      }

      const serviceRequest = requestResult.rows[0];

      if (serviceRequest.status !== 'paid' && serviceRequest.status !== 'completed') {
        return res.status(400).json({ error: 'Service must be completed before rating' });
      }

      let to_user_id;
      if (req.user.role === 'client' && serviceRequest.client_id === req.user.id) {
        to_user_id = serviceRequest.technician_id;
      } else if (req.user.role === 'technician' && serviceRequest.technician_id === req.user.id) {
        to_user_id = serviceRequest.client_id;
      } else {
        return res.status(403).json({ error: 'You are not part of this service request' });
      }

      if (!to_user_id) {
        return res.status(400).json({ error: 'Cannot rate: no technician assigned' });
      }

      const existingRating = await query(
        'SELECT id FROM ratings WHERE request_id = $1 AND from_user_id = $2',
        [request_id, req.user.id]
      );

      if (existingRating.rows.length > 0) {
        return res.status(400).json({ error: 'You have already rated this service' });
      }

      const ratingResult = await query(
        `INSERT INTO ratings (request_id, from_user_id, to_user_id, rating, review)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [request_id, req.user.id, to_user_id, rating, review]
      );

      const avgRatingResult = await query(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM ratings WHERE to_user_id = $1',
        [to_user_id]
      );

      await query(
        'UPDATE users SET rating = $1 WHERE id = $2',
        [parseFloat(avgRatingResult.rows[0].avg_rating).toFixed(2), to_user_id]
      );

      res.status(201).json({
        message: 'Rating submitted successfully',
        rating: ratingResult.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get ratings for a user
router.get('/user/:user_id', authenticateToken, async (req, res, next) => {
  try {
    const { user_id } = req.params;

    const result = await query(
      `SELECT r.*, u.name as from_user_name, sr.issue_type
       FROM ratings r
       JOIN users u ON r.from_user_id = u.id
       JOIN service_requests sr ON r.request_id = sr.id
       WHERE r.to_user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [user_id]
    );

    const avgResult = await query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM ratings WHERE to_user_id = $1',
      [user_id]
    );

    res.json({
      ratings: result.rows,
      average: parseFloat(avgResult.rows[0].avg_rating || 0).toFixed(2),
      total: parseInt(avgResult.rows[0].total_ratings || 0)
    });
  } catch (error) {
    next(error);
  }
});

// Get rating for a specific request
router.get('/request/:request_id', authenticateToken, async (req, res, next) => {
  try {
    const { request_id } = req.params;

    const result = await query(
      `SELECT r.*, u.name as from_user_name
       FROM ratings r
       JOIN users u ON r.from_user_id = u.id
       WHERE r.request_id = $1`,
      [request_id]
    );

    res.json({ ratings: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
