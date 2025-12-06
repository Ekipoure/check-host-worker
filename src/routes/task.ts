/**
 * Task Execution Route
 * Agent receives task from main server and executes it
 */
import { Router, Request, Response } from 'express';
import { PingService } from '../services/ping.service';
import { HTTPService } from '../services/http.service';
import { DNSService } from '../services/dns.service';
import { PortCheckService } from '../services/port-check.service';
import { IPGeolocationService } from '../services/ip-geolocation.service';
import { WhoisService } from '../services/whois.service';
import { SubnetCalculatorService } from '../services/subnet-calculator.service';

const router = Router();

// Initialize services
const pingService = new PingService();
const httpService = new HTTPService();
const dnsService = new DNSService();
const portCheckService = new PortCheckService();
const ipGeolocationService = new IPGeolocationService();
const whoisService = new WhoisService();
const subnetCalculatorService = new SubnetCalculatorService();

// Agent info (for this specific agent instance)
// AGENT_ID is required and should be set by deployment system
const agentId = process.env.AGENT_ID;
if (!agentId) {
  console.error('❌ Error: AGENT_ID is required but not set in environment variables');
  console.error('   Please ensure AGENT_ID is set in your .env file');
}

const agentInfo = {
  agentId: agentId || 'unknown',
  countryCode: process.env.AGENT_COUNTRY_CODE || '',
  country: process.env.AGENT_COUNTRY || '',
  city: process.env.AGENT_CITY || '',
  ip: process.env.AGENT_IP || '',
  asn: process.env.AGENT_ASN || ''
};

// Middleware to verify API key (optional, for security)
const verifyApiKey = (req: Request, res: Response, next: Function) => {
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    const providedKey = req.headers['x-api-key'] || req.body.apiKey;
    if (providedKey !== apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
  }
  next();
};

// Execute task
router.post('/execute', verifyApiKey, async (req: Request, res: Response) => {
  try {
    const { taskId, checkType, host, options } = req.body;

    if (!taskId || !checkType || !host) {
      return res.status(400).json({ 
        error: 'Missing required fields: taskId, checkType, host' 
      });
    }

    let result: any;

    switch (checkType) {
      case 'ping':
        // Execute ping from this agent
        const pingResult = await pingService.pingHost(host, agentInfo as any, options);
        result = {
          taskId,
          checkType: 'ping',
          host,
          agentId: agentInfo.agentId,
          nodeId: `${agentInfo.agentId}.node.check-host.net`,
          result: pingResult,
          timestamp: new Date().toISOString()
        };
        break;

      case 'http':
        const httpResult = await httpService.checkHTTP(host, agentInfo as any);
        result = {
          taskId,
          checkType: 'http',
          host,
          agentId: agentInfo.agentId,
          nodeId: `${agentInfo.agentId}.node.check-host.net`,
          result: httpResult,
          timestamp: new Date().toISOString()
        };
        break;

      case 'tcp':
        const tcpResult = await portCheckService.checkTCPPort(host, agentInfo as any);
        result = {
          taskId,
          checkType: 'tcp',
          host,
          agentId: agentInfo.agentId,
          nodeId: `${agentInfo.agentId}.node.check-host.net`,
          result: tcpResult,
          timestamp: new Date().toISOString()
        };
        break;

      case 'udp':
        const udpResult = await portCheckService.checkUDPPort(host, agentInfo as any);
        result = {
          taskId,
          checkType: 'udp',
          host,
          agentId: agentInfo.agentId,
          nodeId: `${agentInfo.agentId}.node.check-host.net`,
          result: udpResult,
          timestamp: new Date().toISOString()
        };
        break;

      case 'dns':
        const dnsResult = await dnsService.resolveDNS(host, agentInfo as any);
        result = {
          taskId,
          checkType: 'dns',
          host,
          agentId: agentInfo.agentId,
          nodeId: `${agentInfo.agentId}.node.check-host.net`,
          result: dnsResult,
          timestamp: new Date().toISOString()
        };
        break;

      case 'ip-info':
        const ipInfoResult = await ipGeolocationService.getIPInfo(host);
        result = {
          taskId,
          checkType: 'ip-info',
          host,
          agentId: agentInfo.agentId,
          nodeId: `${agentInfo.agentId}.node.check-host.net`,
          result: ipInfoResult,
          timestamp: new Date().toISOString()
        };
        break;

      case 'whois':
        const whoisResult = await whoisService.getWhois(host);
        result = {
          taskId,
          checkType: 'whois',
          host,
          agentId: agentInfo.agentId,
          nodeId: `${agentInfo.agentId}.node.check-host.net`,
          result: whoisResult,
          timestamp: new Date().toISOString()
        };
        break;

      case 'subnet-calculator':
        const subnetResult = subnetCalculatorService.calculate(host);
        result = {
          taskId,
          checkType: 'subnet-calculator',
          host,
          agentId: agentInfo.agentId,
          nodeId: `${agentInfo.agentId}.node.check-host.net`,
          result: subnetResult,
          timestamp: new Date().toISOString()
        };
        break;

      default:
        return res.status(400).json({ 
          error: `Unsupported check type: ${checkType}` 
        });
    }

    res.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('Error executing task:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    });
  }
});

export default router;

