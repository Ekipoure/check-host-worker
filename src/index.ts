/**
 * Main Application Entry Point
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { ResultStorage } from './storage/result-storage';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Check-Host Worker Agent API',
    version: '1.0.0',
    endpoints: {
      ping: '/check-ping?host=<hostname>',
      http: '/check-http?host=<url>',
      tcp: '/check-tcp?host=<host:port>',
      udp: '/check-udp?host=<host:port>',
      dns: '/check-dns?host=<hostname>',
      ip_info: '/ip-info?host=<ip_or_hostname>',
      whois: '/whois?domain=<domain>',
      subnet: '/subnet-calculator?input=<range_or_cidr>',
      nodes: '/nodes/ips or /nodes/hosts'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Cleanup expired results every hour
const resultStorage = new ResultStorage();
setInterval(async () => {
  await resultStorage.cleanupExpired();
}, 60 * 60 * 1000); // 1 hour

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 Check-Host Worker Agent running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

