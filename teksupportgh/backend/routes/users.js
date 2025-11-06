import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, email, phone, name, role, location, profile_image, bio, skills, 
              is_available, rating, total_jobs, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { name, location, bio, skills, is_available, profile_image } = req.body;
    
    const result = await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           bio = COALESCE($3, bio),
           skills = COALESCE($4, skills),
           is_available = COALESCE($5, is_available),
           profile_image = COALESCE($6, profile_image),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, email, phone, name, role, location, bio, skills, is_available, profile_image`,
      [name, location, bio, skills, is_available, profile_image, req.user.id]
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: result.rows[0] 
    });
  } catch (error) {
    next(error);
  }
});

// Get available technicians (with location filtering)
router.get('/technicians', authenticateToken, async (req, res, next) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    let queryText = `
      SELECT id, name, phone, location, bio, skills, rating, total_jobs, profile_image
      FROM users 
      WHERE role = 'technician' AND is_available = true
    `;

    const params = [];

    if (lat && lng) {
      queryText += ` ORDER BY 
        (6371 * acos(cos(radians($1)) * cos(radians((location->>'lat')::float)) * 
        cos(radians((location->>'lng')::float) - radians($2)) + 
        sin(radians($1)) * sin(radians((location->>'lat')::float)))) ASC
      `;
      params.push(parseFloat(lat), parseFloat(lng));
    } else {
      queryText += ' ORDER BY rating DESC, total_jobs DESC';
    }

    queryText += ' LIMIT 50';

    const result = await query(queryText, params);

    res.json({ technicians: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get technician details
router.get('/technicians/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const techResult = await query(
      `SELECT id, name, phone, location, bio, skills, rating, total_jobs, profile_image, created_at
       FROM users 
       WHERE id = $1 AND role = 'technician'`,
      [id]
    );

    if (techResult.rows.length === 0) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    const ratingsResult = await query(
      `SELECT r.rating, r.review, r.created_at, u.name as client_name
       FROM ratings r
       JOIN users u ON r.from_user_id = u.id
       WHERE r.to_user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      technician: techResult.rows[0],
      reviews: ratingsResult.rows
    });
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const statsQuery = req.user.role === 'technician'
      ? `SELECT 
          COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
          COUNT(*) FILTER (WHERE status = 'in_progress') as active_jobs,
          AVG(final_cost) as avg_earnings,
          SUM(final_cost) FILTER (WHERE status = 'paid') as total_earnings
         FROM service_requests
         WHERE technician_id = $1`
      : `SELECT 
          COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
          COUNT(*) FILTER (WHERE status IN ('requested', 'accepted', 'in_progress')) as active_requests,
          SUM(final_cost) FILTER (WHERE status = 'paid') as total_spent
         FROM service_requests
         WHERE client_id = $1`;

    const result = await query(statsQuery, [req.user.id]);

    res.json({ stats: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
