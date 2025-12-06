/**
 * Subnet Calculator Service - Convert between IP ranges and CIDR
 */
import { SubnetInfo } from '../types';
import { parseIPRange, ipRangeToCIDR, cidrToIPRange } from '../utils/helpers';
import * as ipaddress from 'ipaddress';

export class SubnetCalculatorService {
  calculate(input: string): SubnetInfo {
    const result: SubnetInfo = {
      input,
      ipRange: undefined,
      cidr: undefined,
      networkAddress: undefined,
      broadcastAddress: undefined,
      totalHosts: undefined
    };

    // Check if input is CIDR notation
    if (input.includes('/')) {
      const ipRange = cidrToIPRange(input);
      if (ipRange) {
        result.ipRange = `${ipRange.start}-${ipRange.end}`;
        result.cidr = input;

        try {
          const network = ipaddress.IPv4.parseCIDR(input);
          result.networkAddress = network.first().toString();
          result.broadcastAddress = network.last().toString();
          result.totalHosts = network.length();
        } catch (error) {
          console.error('Error parsing CIDR:', error);
        }
      }
    } else if (input.includes('-')) {
      // IP range to CIDR
      const ipRange = parseIPRange(input);
      if (ipRange) {
        result.ipRange = input;
        const cidr = ipRangeToCIDR(ipRange.start, ipRange.end);
        if (cidr) {
          result.cidr = cidr;

          try {
            const network = ipaddress.IPv4.parseCIDR(cidr);
            result.networkAddress = network.first().toString();
            result.broadcastAddress = network.last().toString();
            result.totalHosts = network.length();
          } catch (error) {
            console.error('Error parsing CIDR:', error);
          }
        }
      }
    }

    return result;
  }
}

