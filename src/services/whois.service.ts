/**
 * Whois Service - Perform whois lookups
 */
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class WhoisService {
  async getWhois(domainOrIP: string): Promise<any> {
    try {
      const { stdout } = await execAsync(`whois ${domainOrIP}`, { timeout: 10000 });
      
      // Parse whois output (basic parsing)
      const lines = stdout.split('\n');
      const result: any = {
        domain: domainOrIP,
        raw: stdout
      };

      for (const line of lines) {
        if (line.includes('Registrar:')) {
          result.registrar = line.split('Registrar:')[1]?.trim();
        }
        if (line.includes('Creation Date:') || line.includes('Created:')) {
          result.creationDate = line.split(':')[1]?.trim();
        }
        if (line.includes('Expiration Date:') || line.includes('Expires:')) {
          result.expirationDate = line.split(':')[1]?.trim();
        }
        if (line.includes('Name Server:') || line.includes('Name servers:')) {
          if (!result.nameServers) result.nameServers = [];
          result.nameServers.push(line.split(':')[1]?.trim());
        }
      }

      return result;
    } catch (error: any) {
      console.error('Error getting whois:', error);
      return null;
    }
  }
}


