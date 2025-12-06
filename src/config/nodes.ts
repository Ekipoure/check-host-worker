/**
 * Node configuration and management
 */
import { NodeInfo } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class NodeManager {
  private nodes: Map<string, NodeInfo> = new Map();
  private configFile: string;

  constructor(configFile?: string) {
    this.configFile = configFile || path.join(__dirname, '../../config/nodes.json');
    this.loadNodes();
  }

  private loadNodes(): void {
    try {
      if (fs.existsSync(this.configFile)) {
        const config = JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
        const nodesData = config.nodes || {};
        
        for (const [nodeId, nodeData] of Object.entries(nodesData)) {
          this.nodes.set(nodeId, nodeData as NodeInfo);
        }
      } else {
        // Use default nodes
        this.loadDefaultNodes();
      }
    } catch (error) {
      console.error('Error loading nodes:', error);
      this.loadDefaultNodes();
    }
  }

  private loadDefaultNodes(): void {
    const defaultNodes: Record<string, NodeInfo> = {
      us1: {
        countryCode: 'us',
        country: 'USA',
        city: 'Los Angeles',
        ip: '5.253.30.82',
        asn: 'AS18978'
      },
      ir1: {
        countryCode: 'ir',
        country: 'Iran',
        city: 'Tehran',
        ip: '2.147.76.51',
        asn: 'AS58224'
      },
      de1: {
        countryCode: 'de',
        country: 'Germany',
        city: 'Frankfurt',
        ip: '46.4.143.48',
        asn: 'AS24940'
      }
    };

    for (const [nodeId, nodeInfo] of Object.entries(defaultNodes)) {
      this.nodes.set(nodeId, nodeInfo);
    }
  }

  getNode(nodeId: string): NodeInfo | undefined {
    return this.nodes.get(nodeId);
  }

  getAllNodes(): Map<string, NodeInfo> {
    return this.nodes;
  }

  getNodesList(maxNodes?: number, specificNodes?: string[]): Map<string, NodeInfo> {
    if (specificNodes) {
      const result = new Map<string, NodeInfo>();
      for (const nodeId of specificNodes) {
        const node = this.nodes.get(nodeId);
        if (node) {
          result.set(nodeId, node);
        }
      }
      return result;
    }

    const allNodes = new Map(this.nodes);
    
    if (maxNodes && maxNodes < allNodes.size) {
      const limited = new Map<string, NodeInfo>();
      let count = 0;
      for (const [nodeId, node] of allNodes) {
        if (count >= maxNodes) break;
        limited.set(nodeId, node);
        count++;
      }
      return limited;
    }

    return allNodes;
  }

  getNodesForAPI(maxNodes?: number, specificNodes?: string[]): Record<string, string[]> {
    const nodes = this.getNodesList(maxNodes, specificNodes);
    const result: Record<string, string[]> = {};

    for (const [nodeId, node] of nodes) {
      const hostname = `${nodeId}.node.check-host.net`;
      result[hostname] = [
        node.countryCode,
        node.country,
        node.city,
        node.ip,
        node.asn
      ];
    }

    return result;
  }
}

