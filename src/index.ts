/**
 * Agent Main Entry Point
 * Simple worker that receives tasks and returns results
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRouter from './routes/task';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Task execution endpoint
app.use('/task', taskRouter);

// Health check
app.get('/health', (req, res) => {
  const agentId = process.env.AGENT_ID;
  if (!agentId) {
    return res.status(500).json({ 
      status: 'error',
      error: 'AGENT_ID not configured',
      message: 'AGENT_ID must be set in environment variables'
    });
  }
  
  res.json({ 
    status: 'healthy',
    agentId: agentId,
    version: '1.0.0'
  });
});

// Agent info
app.get('/info', (req, res) => {
  const agentId = process.env.AGENT_ID;
  if (!agentId) {
    return res.status(500).json({ 
      error: 'AGENT_ID not configured',
      message: 'AGENT_ID must be set in environment variables'
    });
  }
  
  res.json({
    agentId: agentId,
    name: process.env.AGENT_NAME || 'Check-Host Agent',
    location: process.env.AGENT_LOCATION,
    countryCode: process.env.AGENT_COUNTRY_CODE,
    country: process.env.AGENT_COUNTRY,
    city: process.env.AGENT_CITY,
    ip: process.env.AGENT_IP,
    asn: process.env.AGENT_ASN,
    version: '1.0.0'
  });
});

// Start server
const port = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
app.listen(port, HOST, () => {
  console.log(`🚀 Check-Host Agent running on http://${HOST}:${port}`);
  console.log(`📊 Agent ID: ${process.env.AGENT_ID || 'not configured'}`);
  console.log(`📍 Location: ${process.env.AGENT_CITY || 'unknown'}, ${process.env.AGENT_COUNTRY || 'unknown'}`);
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
