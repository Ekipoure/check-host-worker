/**
 * DNS Service - Perform DNS resolution checks
 */
import * as dns from 'dns/promises';
import * as nativeDns from 'native-dns';
import { promisify } from 'util';
import { NodeInfo, DNSRecord } from '../types';
import { isValidIP, resolveHostname } from '../utils/helpers';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

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

    let ttl: number | undefined = undefined;

    // Use native-dns to get TTL for A records
    try {
      const question = nativeDns.Question({
        name: hostname,
        type: 'A',
      });

      const req = nativeDns.Request({
        question: question,
        server: { address: '8.8.8.8', port: 53, type: 'udp' },
        timeout: this.timeout,
      });

      const aRecordsWithTTL = await new Promise<any[]>((resolve, reject) => {
        const answers: any[] = [];
        let resolved = false;
        
        req.on('message', (err: any, msg: any) => {
          if (err) {
            if (!resolved) {
              resolved = true;
              reject(err);
            }
            return;
          }
          if (msg && msg.answer) {
            msg.answer.forEach((answer: any) => {
              if (answer.type === 1) { // A record
                answers.push({
                  address: answer.address,
                  ttl: answer.ttl,
                });
              }
            });
          }
          if (!resolved) {
            resolved = true;
            resolve(answers);
          }
        });

        req.on('timeout', () => {
          if (!resolved) {
            resolved = true;
            reject(new Error('DNS query timeout'));
          }
        });

        req.on('error', (err: any) => {
          if (!resolved) {
            resolved = true;
            reject(err);
          }
        });

        req.send();
      });

      if (aRecordsWithTTL.length > 0) {
        result.A = aRecordsWithTTL.map((r: any) => r.address);
        // Get TTL from first A record
        if (aRecordsWithTTL[0].ttl) {
          ttl = aRecordsWithTTL[0].ttl;
        }
      }
    } catch (error) {
      // Fallback to standard dns.resolve4 if native-dns fails
      console.warn('native-dns failed for A records, using fallback:', error);
      try {
        const aRecords = await resolve4(hostname) as string[];
        result.A = aRecords;
      } catch (err) {
        console.error('Error resolving A records:', err);
      }
    }

    // Use native-dns to get TTL for AAAA records
    try {
      const question = nativeDns.Question({
        name: hostname,
        type: 'AAAA',
      });

      const req = nativeDns.Request({
        question: question,
        server: { address: '8.8.8.8', port: 53, type: 'udp' },
        timeout: this.timeout,
      });

      const aaaaRecordsWithTTL = await new Promise<any[]>((resolve, reject) => {
        const answers: any[] = [];
        let resolved = false;
        
        req.on('message', (err: any, msg: any) => {
          if (err) {
            if (!resolved) {
              resolved = true;
              reject(err);
            }
            return;
          }
          if (msg && msg.answer) {
            msg.answer.forEach((answer: any) => {
              if (answer.type === 28) { // AAAA record
                answers.push({
                  address: answer.address,
                  ttl: answer.ttl,
                });
              }
            });
          }
          if (!resolved) {
            resolved = true;
            resolve(answers);
          }
        });

        req.on('timeout', () => {
          if (!resolved) {
            resolved = true;
            reject(new Error('DNS query timeout'));
          }
        });

        req.on('error', (err: any) => {
          if (!resolved) {
            resolved = true;
            reject(err);
          }
        });

        req.send();
      });

      if (aaaaRecordsWithTTL.length > 0) {
        result.AAAA = aaaaRecordsWithTTL.map((r: any) => r.address);
        // Get TTL from first AAAA record if A didn't have TTL
        if (!ttl && aaaaRecordsWithTTL[0].ttl) {
          ttl = aaaaRecordsWithTTL[0].ttl;
        }
      }
    } catch (error) {
      // Fallback to standard dns.resolve6 if native-dns fails
      console.warn('native-dns failed for AAAA records, using fallback:', error);
      try {
        const aaaaRecords = await resolve6(hostname) as string[];
        result.AAAA = aaaaRecords;
      } catch (err) {
        console.error('Error resolving AAAA records:', err);
      }
    }

    // Set TTL if we found it
    if (ttl !== undefined) {
      result.TTL = ttl;
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

  // Remove resolveFromNodes - not needed for agent
}
