/**
 * Ping Service - Perform ping checks
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { NodeInfo, PingResult } from '../types';
import { resolveHostname } from '../utils/helpers';

const execAsync = promisify(exec);

export class PingService {
  private pingCount = 4;
  private timeout = 3;

  async pingHost(host: string, node: NodeInfo): Promise<PingResult[][]> {
    const { hostname } = this.parseHost(host);
    
    const ip = await resolveHostname(hostname);
    if (!ip) {
      return [[null as any]];
    }

    const results: PingResult[] = [];
    for (let i = 0; i < this.pingCount; i++) {
      const result = await this.pingIP(ip);
      results.push(result);
    }

    return [results];
  }

  private parseHost(host: string): { hostname: string; port?: number } {
    if (host.includes('://')) {
      host = host.split('://')[1];
    }
    if (host.includes(':')) {
      const parts = host.split(':');
      const port = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(port)) {
        return { hostname: parts.slice(0, -1).join(':') };
      }
    }
    return { hostname: host };
  }

  private async pingIP(ip: string): Promise<PingResult> {
    try {
      const isWindows = process.platform === 'win32';
      const cmd = isWindows
        ? `ping -n 1 -w ${this.timeout * 1000} ${ip}`
        : `ping -c 1 -W ${this.timeout} ${ip}`;

      const { stdout } = await execAsync(cmd, { timeout: this.timeout + 1 });
      const time = this.parsePingTime(stdout, isWindows);

      return {
        status: 'OK',
        time: time || 0,
        ip
      };
    } catch (error: any) {
      if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
        return {
          status: 'TIMEOUT',
          time: this.timeout
        };
      }
      return {
        status: 'MALFORMED',
        time: 0
      };
    }
  }

  private parsePingTime(output: string, isWindows: boolean): number | null {
    if (isWindows) {
      const match = output.match(/time[<=](\d+)ms/i);
      if (match) {
        return parseFloat(match[1]) / 1000.0;
      }
    } else {
      const match = output.match(/time=([\d.]+)\s*ms/i);
      if (match) {
        return parseFloat(match[1]) / 1000.0;
      }
    }
    return null;
  }

  // Remove pingFromNodes - not needed for agent
}
