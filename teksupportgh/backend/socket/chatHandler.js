import { query } from '../config/database.js';

export const setupChatHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_request', async (requestId) => {
      try {
        socket.join(`request_${requestId}`);
        console.log(`Socket ${socket.id} joined request_${requestId}`);

        const messages = await query(
          `SELECT m.*, u.name as sender_name
           FROM messages m
           JOIN users u ON m.sender_id = u.id
           WHERE m.request_id = $1
           ORDER BY m.created_at ASC`,
          [requestId]
        );

        socket.emit('previous_messages', messages.rows);
      } catch (error) {
        console.error('Error joining request:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    socket.on('send_message', async (data) => {
      try {
        const { request_id, sender_id, content } = data;

        const result = await query(
          `INSERT INTO messages (request_id, sender_id, content)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [request_id, sender_id, content]
        );

        const message = result.rows[0];

        const userResult = await query(
          'SELECT name FROM users WHERE id = $1',
          [sender_id]
        );

        const messageWithSender = {
          ...message,
          sender_name: userResult.rows[0].name
        };

        io.to(`request_${request_id}`).emit('new_message', messageWithSender);

        const requestResult = await query(
          'SELECT client_id, technician_id FROM service_requests WHERE id = $1',
          [request_id]
        );

        if (requestResult.rows.length > 0) {
          const { client_id, technician_id } = requestResult.rows[0];
          const recipient_id = sender_id === client_id ? technician_id : client_id;

          if (recipient_id) {
            await query(
              `INSERT INTO notifications (user_id, title, message, type, related_id)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                recipient_id,
                'New Message',
                `You have a new message in request #${request_id}`,
                'message',
                request_id
              ]
            );

            io.to(`user_${recipient_id}`).emit('notification', {
              type: 'message',
              request_id,
              message: 'You have a new message'
            });
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('mark_read', async (data) => {
      try {
        const { request_id, user_id } = data;

        await query(
          `UPDATE messages 
           SET is_read = true 
           WHERE request_id = $1 AND sender_id != $2`,
          [request_id, user_id]
        );

        socket.emit('messages_marked_read', { request_id });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    socket.on('status_update', async (data) => {
      try {
        const { request_id, status } = data;

        io.to(`request_${request_id}`).emit('request_status_changed', {
          request_id,
          status
        });

        const requestResult = await query(
          'SELECT client_id, technician_id FROM service_requests WHERE id = $1',
          [request_id]
        );

        if (requestResult.rows.length > 0) {
          const { client_id, technician_id } = requestResult.rows[0];

          [client_id, technician_id].forEach(userId => {
            if (userId) {
              io.to(`user_${userId}`).emit('notification', {
                type: 'status_update',
                request_id,
                status,
                message: `Request #${request_id} status changed to ${status}`
              });
            }
          });
        }
      } catch (error) {
        console.error('Error broadcasting status update:', error);
      }
    });

    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined user_${userId}`);
    });

    socket.on('leave_request', (requestId) => {
      socket.leave(`request_${requestId}`);
      console.log(`Socket ${socket.id} left request_${requestId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
