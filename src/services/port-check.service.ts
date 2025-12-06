/**
 * Port Check Service - Check TCP/UDP port connectivity
 */
import * as net from 'net';
import * as dgram from 'dgram';
import { NodeInfo, TCPResult } from '../types';
import { resolveHostname, parseHostPort } from '../utils/helpers';

export class PortCheckService {
  private timeout = 5000;

  async checkTCPPort(host: string, node: NodeInfo): Promise<TCPResult[]> {
    const { hostname, port } = parseHostPort(host);
    
    let targetPort = port;
    if (!targetPort) {
      if (hostname.startsWith('https://')) {
        targetPort = 443;
      } else if (hostname.startsWith('http://')) {
        targetPort = 80;
      } else {
        targetPort = 80;
      }
    }

    const cleanHostname = hostname.replace(/^https?:\/\//, '');
    const ip = await resolveHostname(cleanHostname);
    
    if (!ip) {
      return [{ error: 'Unable to resolve hostname' }];
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      const socket = new net.Socket();

      socket.setTimeout(this.timeout);

      socket.on('connect', () => {
        const elapsed = (Date.now() - startTime) / 1000;
        socket.destroy();
        resolve([{
          time: Math.round(elapsed * 1000) / 1000,
          address: ip
        }]);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve([{ error: 'Connection timed out' }]);
      });

      socket.on('error', (error: Error) => {
        resolve([{ error: error.message }]);
      });

      socket.connect(targetPort!, ip);
    });
  }

  async checkUDPPort(host: string, node: NodeInfo): Promise<TCPResult[]> {
    const { hostname, port } = parseHostPort(host);
    
    const targetPort = port || 53; // Default DNS port
    const cleanHostname = hostname.replace(/^https?:\/\//, '');
    const ip = await resolveHostname(cleanHostname);
    
    if (!ip) {
      return [{ error: 'Unable to resolve hostname' }];
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      const socket = dgram.createSocket('udp4');

      socket.send(Buffer.from('test'), targetPort, ip, (error) => {
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (error) {
          socket.close();
          resolve([{ error: error.message }]);
          return;
        }

        socket.setTimeout(1000);
        socket.once('message', () => {
          socket.close();
          resolve([{
            time: Math.round(elapsed * 1000) / 1000,
            address: ip
          }]);
        });

        socket.once('timeout', () => {
          socket.close();
          resolve([{
            time: Math.round(elapsed * 1000) / 1000,
            address: ip,
            note: 'No response received'
          }]);
        });
      });
    });
  }

  async checkTCPFromNodes(host: string, nodes: Map<string, NodeInfo>): Promise<Record<string, any[]>> {
    const tasks: Array<Promise<any>> = [];
    const nodeIds: string[] = [];

    for (const [nodeId, node] of nodes) {
      nodeIds.push(nodeId);
      tasks.push(this.checkTCPPort(host, node));
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

  async checkUDPFromNodes(host: string, nodes: Map<string, NodeInfo>): Promise<Record<string, any[]>> {
    const tasks: Array<Promise<any>> = [];
    const nodeIds: string[] = [];

    for (const [nodeId, node] of nodes) {
      nodeIds.push(nodeId);
      tasks.push(this.checkUDPPort(host, node));
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

