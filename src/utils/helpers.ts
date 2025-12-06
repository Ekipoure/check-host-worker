/**
 * Helper utility functions
 */
import { v4 as uuidv4 } from 'uuid';
import * as ipaddress from 'ipaddress';
import { isIP } from 'net';

export function generateRequestId(): string {
  return uuidv4().replace(/-/g, '').substring(0, 12);
}

export function isValidIP(ip: string): boolean {
  try {
    return isIP(ip) !== 0;
  } catch {
    return false;
  }
}

export function isValidHostname(hostname: string): boolean {
  if (hostname.length > 253) return false;
  
  const hostnameRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
  return hostnameRegex.test(hostname);
}

export function parseHostPort(host: string): { hostname: string; port?: number } {
  let hostname = host;
  
  // Remove protocol
  if (hostname.includes('://')) {
    hostname = hostname.split('://')[1];
  }
  
  // Parse port
  if (hostname.includes(':')) {
    const parts = hostname.split(':');
    const port = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(port)) {
      hostname = parts.slice(0, -1).join(':');
      return { hostname, port };
    }
  }
  
  return { hostname };
}

export function ipRangeToCIDR(startIP: string, endIP: string): string | null {
  try {
    const start = ipaddress.Ipv4.create(startIP);
    const end = ipaddress.Ipv4.create(endIP);
    
    // Find the network that contains both IPs
    for (let prefixLen = 32; prefixLen >= 0; prefixLen--) {
      try {
        const testNetwork = start.change_prefix(prefixLen);
        if (testNetwork && testNetwork.includes(end)) {
          return testNetwork.to_s() + '/' + prefixLen;
        }
      } catch {
        // Continue to next prefix
      }
    }
  } catch (error) {
    console.error('Error converting IP range to CIDR:', error);
  }
  
  return null;
}

export function cidrToIPRange(cidr: string): { start: string; end: string } | null {
  try {
    const network = ipaddress.Ipv4.create(cidr);
    return {
      start: network.first().to_s(),
      end: network.last().to_s()
    };
  } catch (error) {
    console.error('Error converting CIDR to IP range:', error);
    return null;
  }
}

export function parseIPRange(ipRange: string): { start: string; end: string } | null {
  // Try IP range format (e.g., "192.168.1.0-192.168.1.255")
  if (ipRange.includes('-')) {
    const parts = ipRange.split('-');
    if (parts.length === 2) {
      const start = parts[0].trim();
      const end = parts[1].trim();
      if (isValidIP(start) && isValidIP(end)) {
        return { start, end };
      }
    }
  }
  
  // Try CIDR notation
  if (ipRange.includes('/')) {
    return cidrToIPRange(ipRange);
  }
  
  return null;
}

export async function resolveHostname(hostname: string): Promise<string | null> {
  if (isValidIP(hostname)) {
    return hostname;
  }
  
  try {
    const dns = require('dns').promises;
    const addresses = await dns.resolve4(hostname);
    return addresses[0] || null;
  } catch (error) {
    console.error('Error resolving hostname:', error);
    return null;
  }
}

