/**
 * DNS Service - Perform DNS resolution checks
 */
import * as dns from 'dns/promises';
import { NodeInfo, DNSRecord } from '../types';
import { isValidIP, resolveHostname } from '../utils/helpers';

export class DNSService {
  private timeout = 5000;

  async resolveDNS(host: string, node: NodeInfo): Promise<DNSRecord[]> {
    if (isValidIP(host)) {
      return this.reverseDNS(host, node);
    }
    return this.forwardDNS(host, node);
  }

  private async forwardDNS(hostname: string, node: NodeInfo): Promise<DNSRecord[]> {
    const result: DNSRecord = {
      A: [],
      AAAA: [],
      TTL: undefined
    };

    try {
      // Resolve A records (IPv4)
      const aRecords = await dns.resolve4(hostname);
      result.A = aRecords;
    } catch (error) {
      console.error('Error resolving A records:', error);
    }

    try {
      // Resolve AAAA records (IPv6)
      const aaaaRecords = await dns.resolve6(hostname);
      result.AAAA = aaaaRecords;
    } catch (error) {
      console.error('Error resolving AAAA records:', error);
    }

    return [result];
  }

  private async reverseDNS(ip: string, node: NodeInfo): Promise<DNSRecord[]> {
    const result: DNSRecord = {
      A: [],
      AAAA: [],
      TTL: undefined
    };

    try {
      const hostnames = await dns.reverse(ip);
      result.A = hostnames; // Store hostname in A field for display
    } catch (error) {
      console.error('Error resolving PTR record:', error);
    }

    return [result];
  }

  async resolveFromNodes(host: string, nodes: Map<string, NodeInfo>): Promise<Record<string, any[]>> {
    const tasks: Array<Promise<any>> = [];
    const nodeIds: string[] = [];

    for (const [nodeId, node] of nodes) {
      nodeIds.push(nodeId);
      tasks.push(this.resolveDNS(host, node));
    }

    const results = await Promise.all(tasks);
    const resultMap: Record<string, any[]> = {};

    for (let i = 0; i < nodeIds.length; i++) {
      const nodeId = nodeIds[i];
      const result = results[i];
      const hostname = `${nodeId}.node.check-host.net`;
      resultMap[hostname] = result;
    }

    return resultMap;
  }
}

