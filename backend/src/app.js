import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import aiAgentRoutes from './routes/ai-agents.js';
import ecommerceRoutes from './routes/ecommerce.js';
import graphicsRoutes from './routes/graphics.js';
import contentRoutes from './routes/content.js';
import paymentRoutes from './routes/payment.js';
import securityRoutes from './routes/security.js';
import supportRoutes from './routes/support.js';
import complianceRoutes from './routes/compliance.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { securityMiddleware } from './middleware/security.js';
import { complianceMiddleware } from './middleware/compliance.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(securityMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compliance middleware
app.use(complianceMiddleware);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-commerce', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/api/ai-agents', aiAgentRoutes);
app.use('/api/ecommerce', ecommerceRoutes);
app.use('/api/graphics', graphicsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/compliance', complianceRoutes);

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('ai-agent-update', (data) => {
    socket.broadcast.emit('agent-status-changed', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AI Commerce Backend'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, io };
