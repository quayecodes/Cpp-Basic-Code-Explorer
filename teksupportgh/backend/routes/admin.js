import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// All routes require admin role
router.use(authenticateToken, authorizeRoles('admin'));

// Get dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    const usersStats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE role = 'client') as total_clients,
        COUNT(*) FILTER (WHERE role = 'technician') as total_technicians,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_month
      FROM users
    `);

    const requestsStats = await query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
        COUNT(*) FILTER (WHERE status IN ('requested', 'accepted', 'in_progress')) as active_requests,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as requests_this_month
      FROM service_requests
    `);

    const paymentsStats = await query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
        AVG(amount) FILTER (WHERE status = 'completed') as avg_transaction,
        SUM(amount) FILTER (WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days') as revenue_this_month
      FROM payments
    `);

    res.json({
      users: usersStats.rows[0],
      requests: requestsStats.rows[0],
      payments: paymentsStats.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Get all users with filters
router.get('/users', async (req, res, next) => {
  try {
    const { role, search, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT id, email, phone, name, role, location, rating, total_jobs, is_available, created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (role) {
      queryText += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get user details
router.get('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const requestsResult = await query(
      `SELECT COUNT(*) as total, 
              COUNT(*) FILTER (WHERE status = 'completed') as completed
       FROM service_requests 
       WHERE client_id = $1 OR technician_id = $1`,
      [id]
    );

    const ratingsResult = await query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM ratings WHERE to_user_id = $1',
      [id]
    );

    res.json({
      user: userResult.rows[0],
      stats: {
        requests: requestsResult.rows[0],
        ratings: ratingsResult.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user status
router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    const result = await query(
      'UPDATE users SET is_available = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_available, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User status updated',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Get all service requests
router.get('/requests', async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT sr.*, 
             c.name as client_name, c.email as client_email,
             t.name as technician_name, t.email as technician_email
      FROM service_requests sr
      JOIN users c ON sr.client_id = c.id
      LEFT JOIN users t ON sr.technician_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

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

// Get all payments
router.get('/payments', async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT p.*, 
             sr.issue_type,
             c.name as client_name, c.email as client_email,
             t.name as technician_name
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.id
      JOIN users c ON sr.client_id = c.id
      LEFT JOIN users t ON sr.technician_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    res.json({ payments: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get recent activity
router.get('/activity', async (req, res, next) => {
  try {
    const activities = await query(`
      SELECT 'request' as type, id, created_at, 
             json_build_object('status', status, 'issue_type', issue_type) as data
      FROM service_requests
      WHERE created_at > NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT 'payment' as type, id, created_at,
             json_build_object('status', status, 'amount', amount) as data
      FROM payments
      WHERE created_at > NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT 'user' as type, id, created_at,
             json_build_object('role', role, 'name', name) as data
      FROM users
      WHERE created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 50
    `);

    res.json({ activities: activities.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
