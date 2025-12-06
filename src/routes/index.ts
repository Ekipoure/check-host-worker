/**
 * API Routes - Express routes for all services
 */
import { Router, Request, Response } from 'express';
import { NodeManager } from '../config/nodes';
import { PingService } from '../services/ping.service';
import { HTTPService } from '../services/http.service';
import { DNSService } from '../services/dns.service';
import { PortCheckService } from '../services/port-check.service';
import { IPGeolocationService } from '../services/ip-geolocation.service';
import { WhoisService } from '../services/whois.service';
import { SubnetCalculatorService } from '../services/subnet-calculator.service';
import { ResultStorage } from '../storage/result-storage';
import { generateRequestId } from '../utils/helpers';

const router = Router();

// Initialize services
const nodeManager = new NodeManager();
const pingService = new PingService();
const httpService = new HTTPService();
const dnsService = new DNSService();
const portCheckService = new PortCheckService();
const ipGeolocationService = new IPGeolocationService();
const whoisService = new WhoisService();
const subnetCalculatorService = new SubnetCalculatorService();
const resultStorage = new ResultStorage();

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

// Ping Check
router.get('/check-ping', async (req: Request, res: Response) => {
  try {
    const { host, max_nodes, node } = req.query;
    
    if (!host || typeof host !== 'string') {
      return res.status(400).json({ error: 'host parameter is required' });
    }

    const maxNodes = max_nodes ? parseInt(max_nodes as string, 10) : undefined;
    const nodes = node ? (Array.isArray(node) ? node as string[] : [node as string]) : undefined;

    const requestId = generateRequestId();
    const nodeList = nodeManager.getNodesList(maxNodes, nodes);
    const nodesApi = nodeManager.getNodesForAPI(maxNodes, nodes);

    const results = await pingService.pingFromNodes(host, nodeList);
    await resultStorage.storeResult(requestId, 'ping', host, nodesApi, results);

    res.json({
      ok: 1,
      requestId,
      permanentLink: `${BASE_URL}/check-report/${requestId}`,
      nodes: nodesApi
    });
  } catch (error: any) {
    console.error('Error in ping check:', error);
    res.status(500).json({ error: error.message });
  }
});

// HTTP Check
router.get('/check-http', async (req: Request, res: Response) => {
  try {
    const { host, max_nodes, node } = req.query;
    
    if (!host || typeof host !== 'string') {
      return res.status(400).json({ error: 'host parameter is required' });
    }

    const maxNodes = max_nodes ? parseInt(max_nodes as string, 10) : undefined;
    const nodes = node ? (Array.isArray(node) ? node as string[] : [node as string]) : undefined;

    const requestId = generateRequestId();
    const nodeList = nodeManager.getNodesList(maxNodes, nodes);
    const nodesApi = nodeManager.getNodesForAPI(maxNodes, nodes);

    const results = await httpService.checkFromNodes(host, nodeList);
    await resultStorage.storeResult(requestId, 'http', host, nodesApi, results);

    res.json({
      ok: 1,
      requestId,
      permanentLink: `${BASE_URL}/check-report/${requestId}`,
      nodes: nodesApi
    });
  } catch (error: any) {
    console.error('Error in HTTP check:', error);
    res.status(500).json({ error: error.message });
  }
});

// TCP Port Check
router.get('/check-tcp', async (req: Request, res: Response) => {
  try {
    const { host, max_nodes, node } = req.query;
    
    if (!host || typeof host !== 'string') {
      return res.status(400).json({ error: 'host parameter is required' });
    }

    const maxNodes = max_nodes ? parseInt(max_nodes as string, 10) : undefined;
    const nodes = node ? (Array.isArray(node) ? node as string[] : [node as string]) : undefined;

    const requestId = generateRequestId();
    const nodeList = nodeManager.getNodesList(maxNodes, nodes);
    const nodesApi = nodeManager.getNodesForAPI(maxNodes, nodes);

    const results = await portCheckService.checkTCPFromNodes(host, nodeList);
    await resultStorage.storeResult(requestId, 'tcp', host, nodesApi, results);

    res.json({
      ok: 1,
      requestId,
      permanentLink: `${BASE_URL}/check-report/${requestId}`,
      nodes: nodesApi
    });
  } catch (error: any) {
    console.error('Error in TCP check:', error);
    res.status(500).json({ error: error.message });
  }
});

// UDP Port Check
router.get('/check-udp', async (req: Request, res: Response) => {
  try {
    const { host, max_nodes, node } = req.query;
    
    if (!host || typeof host !== 'string') {
      return res.status(400).json({ error: 'host parameter is required' });
    }

    const maxNodes = max_nodes ? parseInt(max_nodes as string, 10) : undefined;
    const nodes = node ? (Array.isArray(node) ? node as string[] : [node as string]) : undefined;

    const requestId = generateRequestId();
    const nodeList = nodeManager.getNodesList(maxNodes, nodes);
    const nodesApi = nodeManager.getNodesForAPI(maxNodes, nodes);

    const results = await portCheckService.checkUDPFromNodes(host, nodeList);
    await resultStorage.storeResult(requestId, 'udp', host, nodesApi, results);

    res.json({
      ok: 1,
      requestId,
      permanentLink: `${BASE_URL}/check-report/${requestId}`,
      nodes: nodesApi
    });
  } catch (error: any) {
    console.error('Error in UDP check:', error);
    res.status(500).json({ error: error.message });
  }
});

// DNS Check
router.get('/check-dns', async (req: Request, res: Response) => {
  try {
    const { host, max_nodes, node } = req.query;
    
    if (!host || typeof host !== 'string') {
      return res.status(400).json({ error: 'host parameter is required' });
    }

    const maxNodes = max_nodes ? parseInt(max_nodes as string, 10) : undefined;
    const nodes = node ? (Array.isArray(node) ? node as string[] : [node as string]) : undefined;

    const requestId = generateRequestId();
    const nodeList = nodeManager.getNodesList(maxNodes, nodes);
    const nodesApi = nodeManager.getNodesForAPI(maxNodes, nodes);

    const results = await dnsService.resolveFromNodes(host, nodeList);
    await resultStorage.storeResult(requestId, 'dns', host, nodesApi, results);

    res.json({
      ok: 1,
      requestId,
      permanentLink: `${BASE_URL}/check-report/${requestId}`,
      nodes: nodesApi
    });
  } catch (error: any) {
    console.error('Error in DNS check:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Check Result
router.get('/check-result/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const result = await resultStorage.getResult(requestId);
    
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error getting result:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Extended Check Result
router.get('/check-result-extended/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const result = await resultStorage.getExtendedResult(requestId);
    
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error getting extended result:', error);
    res.status(500).json({ error: error.message });
  }
});

// IP Info
router.get('/ip-info', async (req: Request, res: Response) => {
  try {
    const { host } = req.query;
    
    if (!host || typeof host !== 'string') {
      return res.status(400).json({ error: 'host parameter is required' });
    }

    const sources = await ipGeolocationService.getIPInfo(host);
    
    if (sources.length === 0) {
      return res.status(404).json({ error: 'Unable to get IP information' });
    }

    res.json({
      ip: sources[0].ip,
      sources
    });
  } catch (error: any) {
    console.error('Error getting IP info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Whois
router.get('/whois', async (req: Request, res: Response) => {
  try {
    const { domain } = req.query;
    
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'domain parameter is required' });
    }

    const result = await whoisService.getWhois(domain);
    
    if (!result) {
      return res.status(404).json({ error: 'Unable to get whois information' });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error getting whois:', error);
    res.status(500).json({ error: error.message });
  }
});

// Subnet Calculator
router.get('/subnet-calculator', async (req: Request, res: Response) => {
  try {
    const { input } = req.query;
    
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'input parameter is required' });
    }

    const result = subnetCalculatorService.calculate(input);
    res.json(result);
  } catch (error: any) {
    console.error('Error calculating subnet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Nodes
router.get('/nodes/ips', async (req: Request, res: Response) => {
  try {
    const nodes = nodeManager.getAllNodes();
    const result: Record<string, any> = {
      nodes: {}
    };

    for (const [nodeId, node] of nodes) {
      const hostname = `${nodeId}.node.check-host.net`;
      result.nodes[hostname] = {
        ip: node.ip,
        asn: node.asn,
        location: [node.countryCode, node.country, node.city]
      };
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error getting nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/nodes/hosts', async (req: Request, res: Response) => {
  try {
    const nodes = nodeManager.getAllNodes();
    const result: Record<string, any> = {
      nodes: {}
    };

    for (const [nodeId, node] of nodes) {
      const hostname = `${nodeId}.node.check-host.net`;
      result.nodes[hostname] = {
        asn: node.asn,
        ip: node.ip,
        location: [node.countryCode, node.country, node.city]
      };
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error getting nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

