import express from 'express';
import axios from 'axios';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// Hubtel Payment Integration
const hubtelAPI = axios.create({
  baseURL: process.env.HUBTEL_API_URL,
  auth: {
    username: process.env.HUBTEL_CLIENT_ID,
    password: process.env.HUBTEL_CLIENT_SECRET
  }
});

// Initiate payment
router.post('/initiate',
  authenticateToken,
  authorizeRoles('client'),
  async (req, res, next) => {
    try {
      const { request_id, payment_method } = req.body;

      const requestResult = await query(
        'SELECT * FROM service_requests WHERE id = $1 AND client_id = $2',
        [request_id, req.user.id]
      );

      if (requestResult.rows.length === 0) {
        return res.status(404).json({ error: 'Service request not found' });
      }

      const serviceRequest = requestResult.rows[0];

      if (serviceRequest.status !== 'completed') {
        return res.status(400).json({ error: 'Service must be completed before payment' });
      }

      if (!serviceRequest.final_cost) {
        return res.status(400).json({ error: 'Final cost not set' });
      }

      const existingPayment = await query(
        'SELECT * FROM payments WHERE request_id = $1 AND status IN ($2, $3)',
        [request_id, 'completed', 'processing']
      );

      if (existingPayment.rows.length > 0) {
        return res.status(400).json({ error: 'Payment already processed or in progress' });
      }

      const paymentRecord = await query(
        `INSERT INTO payments (request_id, amount, payment_method, status)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [request_id, serviceRequest.final_cost, payment_method, 'pending']
      );

      const payment = paymentRecord.rows[0];

      try {
        const hubtelResponse = await hubtelAPI.post('/merchantaccount/merchants/' + process.env.HUBTEL_MERCHANT_ACCOUNT + '/receive/mobilemoney', {
          CustomerName: req.user.name,
          CustomerMsisdn: req.user.phone,
          CustomerEmail: req.user.email,
          Channel: payment_method,
          Amount: serviceRequest.final_cost,
          PrimaryCallbackUrl: process.env.PAYMENT_CALLBACK_URL,
          Description: `Payment for service request #${request_id}`,
          ClientReference: payment.id.toString()
        });

        await query(
          `UPDATE payments 
           SET status = $1, momo_reference = $2, metadata = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          ['processing', hubtelResponse.data.TransactionId, JSON.stringify(hubtelResponse.data), payment.id]
        );

        res.json({
          message: 'Payment initiated successfully',
          payment_id: payment.id,
          transaction_id: hubtelResponse.data.TransactionId,
          status: 'processing'
        });
      } catch (hubtelError) {
        console.error('Hubtel API error:', hubtelError.response?.data || hubtelError.message);
        
        await query(
          'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['failed', payment.id]
        );

        res.status(500).json({
          error: 'Payment initiation failed',
          message: 'Please try again or contact support',
          payment_id: payment.id
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Payment callback (webhook from Hubtel)
router.post('/callback', async (req, res, next) => {
  try {
    const { ClientReference, Status, TransactionId, Data } = req.body;

    console.log('Payment callback received:', req.body);

    const paymentResult = await query(
      'SELECT * FROM payments WHERE id = $1',
      [parseInt(ClientReference)]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];
    let newStatus = 'failed';

    if (Status === 'Success' || Data?.Status === 'Success') {
      newStatus = 'completed';
      
      await query(
        `UPDATE service_requests 
         SET status = 'paid', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [payment.request_id]
      );

      await query(
        `UPDATE users 
         SET total_jobs = total_jobs + 1
         WHERE id = (SELECT technician_id FROM service_requests WHERE id = $1)`,
        [payment.request_id]
      );
    }

    await query(
      `UPDATE payments 
       SET status = $1, transaction_id = $2, metadata = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [newStatus, TransactionId, JSON.stringify(req.body), payment.id]
    );

    res.json({ message: 'Callback processed successfully' });
  } catch (error) {
    console.error('Callback error:', error);
    next(error);
  }
});

// Get payment status
router.get('/:payment_id', authenticateToken, async (req, res, next) => {
  try {
    const { payment_id } = req.params;

    const result = await query(
      `SELECT p.*, sr.client_id, sr.technician_id
       FROM payments p
       JOIN service_requests sr ON p.request_id = sr.id
       WHERE p.id = $1`,
      [payment_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = result.rows[0];

    if (payment.client_id !== req.user.id && payment.technician_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ payment });
  } catch (error) {
    next(error);
  }
});

// Get payment history
router.get('/history/all', authenticateToken, async (req, res, next) => {
  try {
    const queryText = req.user.role === 'technician'
      ? `SELECT p.*, sr.issue_type, u.name as client_name
         FROM payments p
         JOIN service_requests sr ON p.request_id = sr.id
         JOIN users u ON sr.client_id = u.id
         WHERE sr.technician_id = $1 AND p.status = 'completed'
         ORDER BY p.created_at DESC
         LIMIT 50`
      : `SELECT p.*, sr.issue_type, u.name as technician_name
         FROM payments p
         JOIN service_requests sr ON p.request_id = sr.id
         LEFT JOIN users u ON sr.technician_id = u.id
         WHERE sr.client_id = $1
         ORDER BY p.created_at DESC
         LIMIT 50`;

    const result = await query(queryText, [req.user.id]);

    res.json({ payments: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
