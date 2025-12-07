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
          const network = ipaddress.Ipv4.create(input);
          result.networkAddress = network.first().to_s();
          result.broadcastAddress = network.last().to_s();
          const size = network.size();
          result.totalHosts = typeof size === 'number' ? size : Number(size.toString());
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
            const network = ipaddress.Ipv4.create(cidr);
            result.networkAddress = network.first().to_s();
            result.broadcastAddress = network.last().to_s();
            const size = network.size();
            result.totalHosts = typeof size === 'number' ? size : Number(size.toString());
          } catch (error) {
            console.error('Error parsing CIDR:', error);
          }
        }
      }
    }

    return result;
  }
}


