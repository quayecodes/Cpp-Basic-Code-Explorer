import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// Create service request
router.post('/', 
  authenticateToken,
  authorizeRoles('client'),
  [
    body('issue_type').notEmpty(),
    body('description').isLength({ min: 10 }),
    body('location').isObject()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { issue_type, description, location, category_id, estimated_cost } = req.body;

      const result = await query(
        `INSERT INTO service_requests (client_id, issue_type, description, location, category_id, estimated_cost)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.user.id, issue_type, description, JSON.stringify(location), category_id, estimated_cost]
      );

      res.status(201).json({
        message: 'Service request created successfully',
        request: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get all requests (filtered by user role)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT sr.*, 
             c.name as client_name, c.phone as client_phone, c.location as client_location,
             t.name as technician_name, t.phone as technician_phone,
             sc.name as category_name
      FROM service_requests sr
      JOIN users c ON sr.client_id = c.id
      LEFT JOIN users t ON sr.technician_id = t.id
      LEFT JOIN service_categories sc ON sr.category_id = sc.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (req.user.role === 'client') {
      queryText += ` AND sr.client_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (req.user.role === 'technician') {
      queryText += ` AND (sr.technician_id = $${paramCount} OR (sr.status = 'requested' AND sr.technician_id IS NULL))`;
      params.push(req.user.id);
      paramCount++;
    }

    if (status) {
      queryText += ` AND sr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY sr.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    res.json({ requests: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get single request
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT sr.*, 
              c.name as client_name, c.phone as client_phone, c.email as client_email, c.location as client_location,
              t.name as technician_name, t.phone as technician_phone, t.email as technician_email,
              sc.name as category_name
       FROM service_requests sr
       JOIN users c ON sr.client_id = c.id
       LEFT JOIN users t ON sr.technician_id = t.id
       LEFT JOIN service_categories sc ON sr.category_id = sc.id
       WHERE sr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = result.rows[0];

    if (req.user.role === 'client' && request.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'technician' && request.technician_id !== req.user.id && request.status !== 'requested') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ request: request });
  } catch (error) {
    next(error);
  }
});

// Accept request (technician)
router.post('/:id/accept', 
  authenticateToken,
  authorizeRoles('technician'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const result = await query(
        `UPDATE service_requests 
         SET technician_id = $1, status = 'accepted', updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND status = 'requested' AND technician_id IS NULL
         RETURNING *`,
        [req.user.id, id]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Request not available or already accepted' });
      }

      res.json({
        message: 'Request accepted successfully',
        request: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update request status
router.patch('/:id/status',
  authenticateToken,
  [body('status').isIn(['in_progress', 'completed', 'cancelled'])],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status, final_cost } = req.body;

      const checkResult = await query(
        'SELECT * FROM service_requests WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }

      const request = checkResult.rows[0];

      if (req.user.role === 'technician' && request.technician_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (req.user.role === 'client' && request.client_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
      const params = [status];
      let paramCount = 2;

      if (status === 'completed' && final_cost) {
        updateFields.push(`final_cost = $${paramCount}`);
        params.push(final_cost);
        paramCount++;
        updateFields.push('completed_at = CURRENT_TIMESTAMP');
      }

      params.push(id);

      const result = await query(
        `UPDATE service_requests 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        params
      );

      res.json({
        message: 'Request status updated successfully',
        request: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get service categories
router.get('/categories/all', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM service_categories ORDER BY name');
    res.json({ categories: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
