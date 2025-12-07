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

  async pingHost(host: string, node: NodeInfo, options?: { count?: number }): Promise<PingResult[][]> {
    const { hostname } = this.parseHost(host);
    const count = options?.count || this.pingCount;
    
    const ip = await resolveHostname(hostname);
    if (!ip) {
      return [[null as any]];
    }

    const results: PingResult[] = [];
    for (let i = 0; i < count; i++) {
      const result = await this.pingIP(ip);
      // Always include IP in result, even if ping failed
      results.push({
        ...result,
        ip: result.ip || ip
      });
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

      const { stdout, stderr } = await execAsync(cmd, { timeout: (this.timeout + 1) * 1000 });
      
      // Debug logging (can be removed in production)
      if (stderr && stderr.trim()) {
        console.log(`Ping stderr for ${ip}:`, stderr);
      }
      
      const time = this.parsePingTime(stdout, isWindows);
      
      // Debug logging
      if (time === null) {
        console.log(`Could not parse ping time for ${ip}. Output:`, stdout.substring(0, 200));
      }

      // If we couldn't parse the time, check if ping actually succeeded
      // On Linux, a successful ping will have "1 received" in the output
      // On Windows, a successful ping will have "Reply from" in the output
      if (time === null) {
        const hasSuccess = isWindows 
          ? stdout.includes('Reply from') || stdout.includes('bytes=')
          : stdout.includes('1 received') || stdout.match(/time=/) !== null;
        
        if (!hasSuccess) {
          // Ping command didn't fail, but no successful response
          return {
            status: 'TIMEOUT',
            time: this.timeout,
            ip
          };
        }
        
        // Ping succeeded but we couldn't parse time - try alternative patterns
        // Try to extract time from different formats
        const altMatch = stdout.match(/(\d+\.?\d*)\s*ms/i);
        if (altMatch) {
          const parsedTime = parseFloat(altMatch[1]) / 1000.0;
          return {
            status: 'OK',
            time: parsedTime,
            ip
          };
        }
        
        // If we still can't parse, but ping succeeded, return with 0 time
        // This is better than marking it as failed
        return {
          status: 'OK',
          time: 0,
          ip
        };
      }

      return {
        status: 'OK',
        time: time,
        ip
      };
    } catch (error: any) {
      // Debug logging
      console.log(`Ping error for ${ip}:`, {
        code: error.code,
        signal: error.signal,
        message: error.message,
        stdout: error.stdout?.substring(0, 200),
        stderr: error.stderr?.substring(0, 200)
      });
      
      // Always include IP in result, even if ping failed
      if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM' || error.code === 'TIMEOUT') {
        return {
          status: 'TIMEOUT',
          time: this.timeout,
          ip
        };
      }
      return {
        status: 'MALFORMED',
        time: 0,
        ip
      };
    }
  }

  private parsePingTime(output: string, isWindows: boolean): number | null {
    if (isWindows) {
      // Try multiple patterns for Windows ping output
      // Format: "time=123ms" or "time<123ms" or "time<=123ms"
      let match = output.match(/time[<=](\d+)ms/i);
      if (match) {
        return parseFloat(match[1]) / 1000.0;
      }
      // Alternative: "Reply from ... time=123ms"
      match = output.match(/time=(\d+)ms/i);
      if (match) {
        return parseFloat(match[1]) / 1000.0;
      }
    } else {
      // Linux ping output: "time=12.345 ms" or "time=12.345ms"
      // Try the standard format first
      let match = output.match(/time=([\d.]+)\s*ms/i);
      if (match) {
        return parseFloat(match[1]) / 1000.0;
      }
      // Try without space: "time=12.345ms"
      match = output.match(/time=([\d.]+)ms/i);
      if (match) {
        return parseFloat(match[1]) / 1000.0;
      }
      // Try alternative format from some ping implementations
      match = output.match(/(\d+\.?\d*)\s*ms/i);
      if (match) {
        return parseFloat(match[1]) / 1000.0;
      }
    }
    return null;
  }

  // Remove pingFromNodes - not needed for agent
}
