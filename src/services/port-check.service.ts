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
      let resolved = false;

      // Handle socket errors (like ECONNREFUSED)
      socket.on('error', (error: NodeJS.ErrnoException) => {
        if (!resolved) {
          resolved = true;
          socket.close();
          // Check for connection refused errors
          if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED') || error.message.includes('Connection refused')) {
            resolve([{ error: 'Connection refused' }]);
          } else {
            resolve([{ error: error.message }]);
          }
        }
      });

      socket.send(Buffer.from('test'), targetPort, ip, (error) => {
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (error) {
          if (!resolved) {
            resolved = true;
            socket.close();
            // Check for connection refused errors
            if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED') || error.message.includes('Connection refused')) {
              resolve([{ error: 'Connection refused' }]);
            } else {
              resolve([{ error: error.message }]);
            }
          }
          return;
        }

        // Use a timer for UDP timeout since dgram.Socket doesn't have setTimeout
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            socket.close();
            // No response means port is open or filtered (UDP can't distinguish)
            resolve([{
              time: Math.round(elapsed * 1000) / 1000,
              address: ip,
              note: 'Open or filtered'
            }]);
          }
        }, 1000);

        socket.once('message', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            socket.close();
            // Response received means port is open or filtered
            resolve([{
              time: Math.round(elapsed * 1000) / 1000,
              address: ip,
              note: 'Open or filtered'
            }]);
          }
        });
      });
    });
  }

  // Remove checkTCPFromNodes and checkUDPFromNodes - not needed for agent
}
