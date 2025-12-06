/**
 * HTTP Service - Perform HTTP/HTTPS checks
 */
import axios, { AxiosError } from 'axios';
import { NodeInfo, HTTPResult } from '../types';

export class HTTPService {
  private timeout = 10000; // 10 seconds

  async checkHTTP(url: string, node: NodeInfo): Promise<HTTPResult[][]> {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
      }

      const startTime = Date.now();
      
      try {
        const response = await axios.get(url, {
          timeout: this.timeout,
          maxRedirects: 5,
          validateStatus: () => true // Accept all status codes
        });

        const elapsed = (Date.now() - startTime) / 1000;
        const ip = response.request?.socket?.remoteAddress || 
                   response.request?.res?.socket?.remoteAddress || 
                   null;

        return [[{
          success: response.status >= 200 && response.status < 400 ? 1 : 0,
          time: Math.round(elapsed * 1000) / 1000,
          message: response.statusText || 'OK',
          statusCode: response.status.toString(),
          ip: ip || undefined
        }]];
      } catch (error: any) {
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          return [[{
            success: 0,
            time: Math.round(elapsed * 1000) / 1000,
            message: 'Connection timeout',
            statusCode: undefined,
            ip: undefined
          }]];
        }

        return [[{
          success: 0,
          time: Math.round(elapsed * 1000) / 1000,
          message: error.message || 'Connection error',
          statusCode: undefined,
          ip: undefined
        }]];
      }
    } catch (error: any) {
      return [[{
        success: 0,
        time: 0,
        message: error.message || 'Unknown error',
        statusCode: undefined,
        ip: undefined
      }]];
    }
  }

  async checkFromNodes(url: string, nodes: Map<string, NodeInfo>): Promise<Record<string, any[]>> {
    const tasks: Array<Promise<any>> = [];
    const nodeIds: string[] = [];

    for (const [nodeId, node] of nodes) {
      nodeIds.push(nodeId);
      tasks.push(this.checkHTTP(url, node));
    }

    const results = await Promise.all(tasks);
    const resultMap: Record<string, any[]> = {};

    for (let i = 0; i < nodeIds.length; i++) {
      const nodeId = nodeIds[i];
      const result = results[i];
      const hostname = `${nodeId}.node.check-host.net`;
      
      // Convert HTTPResult to array format
      resultMap[hostname] = result.map((httpResults: HTTPResult[]) => 
        httpResults.map((r: any) => [
          r.success,
          r.time,
          r.message,
          r.statusCode || null,
          r.ip || null
        ])
      );
    }

    return resultMap;
  }
}

