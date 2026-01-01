/**
 * DNS Service - Perform DNS resolution checks
 */
import * as dns from 'dns/promises';
import { NodeInfo, DNSRecord } from '../types';
import { isValidIP, resolveHostname } from '../utils/helpers';

// Try to load native-dns, but make it optional
let nativeDns: any = null;
try {
  nativeDns = require('native-dns');
} catch (error) {
  console.warn('native-dns module not available, will use fallback DNS resolution');
}

export class DNSService {
  private timeout = 5000;
  // Multiple DNS servers to try as fallback
  private dnsServers = ['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1'];

  async resolveDNS(host: string, node: NodeInfo): Promise<DNSRecord[]> {
    if (isValidIP(host)) {
      return this.reverseDNS(host, node);
    }
    return this.forwardDNS(host, node);
  }

  /**
   * Query DNS using native-dns with multiple server fallbacks
   */
  private async queryNativeDNS(hostname: string, type: 'A' | 'AAAA', dnsServer?: string): Promise<{ records: any[], ttl?: number, cname?: string }> {
    console.log(`[DNS-native] شروع queryNativeDNS برای ${hostname} نوع ${type}`);
    
    if (!nativeDns) {
      console.log(`[DNS-native] native-dns در دسترس نیست`);
      return { records: [] };
    }

    const serversToTry = dnsServer ? [dnsServer] : this.dnsServers;
    console.log(`[DNS-native] سرورهای DNS برای امتحان:`, serversToTry);
    
    for (const server of serversToTry) {
      console.log(`[DNS-native] تلاش با سرور: ${server}`);
      try {
        const question = nativeDns.Question({
          name: hostname,
          type: type === 'A' ? 'A' : 'AAAA',
        });

        const req = nativeDns.Request({
          question: question,
          server: { address: server, port: 53, type: 'udp' },
          timeout: this.timeout,
        });

        const result = await new Promise<{ records: any[], ttl?: number, cname?: string }>((resolve) => {
          const answers: any[] = [];
          let resolved = false;
          let foundCNAME: string | undefined = undefined;
          
          // Set a safety timeout to ensure promise always resolves
          const safetyTimeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              console.log(`[DNS-native] safety timeout برای ${server}`);
              resolve({ records: [] });
            }
          }, this.timeout + 1000);
          
          req.on('message', (err: any, msg: any) => {
            if (err) {
              console.log(`[DNS-native] خطا در message event برای ${server}:`, err);
              clearTimeout(safetyTimeout);
              if (!resolved) {
                resolved = true;
                resolve({ records: [] });
              }
              return;
            }
            
            console.log(`[DNS-native] دریافت message از ${server}:`, {
              hasAnswer: !!msg?.answer,
              answerCount: msg?.answer?.length || 0,
              hasAdditional: !!msg?.additional,
              additionalCount: msg?.additional?.length || 0
            });
            
            if (msg && msg.answer) {
              msg.answer.forEach((answer: any) => {
                const recordType = type === 'A' ? 1 : 28;
                console.log(`[DNS-native] بررسی answer:`, {
                  type: answer.type,
                  expectedType: recordType,
                  address: answer.address,
                  data: answer.data,
                  name: answer.name
                });
                
                if (answer.type === recordType) {
                  answers.push({
                    address: answer.address,
                    ttl: answer.ttl,
                  });
                  console.log(`[DNS-native] اضافه شد رکورد ${type}:`, answer.address);
                } else if (answer.type === 5) { // CNAME record
                  foundCNAME = answer.data || answer.name || undefined;
                  console.log(`[DNS-native] پیدا شد CNAME:`, foundCNAME);
                }
              });
              
              // Also check additional section
              if (msg.additional) {
                msg.additional.forEach((answer: any) => {
                  const recordType = type === 'A' ? 1 : 28;
                  if (answer.type === recordType) {
                    answers.push({
                      address: answer.address,
                      ttl: answer.ttl,
                    });
                    console.log(`[DNS-native] اضافه شد رکورد ${type} از additional:`, answer.address);
                  }
                });
              }
            } else {
              console.log(`[DNS-native] هیچ answer در message نیست`);
            }
            
            if (!resolved) {
              clearTimeout(safetyTimeout);
              resolved = true;
              const ttl = answers.length > 0 ? answers[0].ttl : undefined;
              console.log(`[DNS-native] resolve کردن promise با ${answers.length} رکورد`);
              resolve({ records: answers, ttl, cname: foundCNAME });
            }
          });

          req.on('timeout', () => {
            console.log(`[DNS-native] timeout برای ${server}`);
            clearTimeout(safetyTimeout);
            if (!resolved) {
              resolved = true;
              resolve({ records: [] });
            }
          });

          req.on('error', (err: any) => {
            console.log(`[DNS-native] error event برای ${server}:`, err?.message || err);
            clearTimeout(safetyTimeout);
            if (!resolved) {
              resolved = true;
              resolve({ records: [] });
            }
          });

          console.log(`[DNS-native] ارسال request برای ${server}`);
          req.send();
        });

        console.log(`[DNS-native] نتیجه از ${server}:`, {
          recordsCount: result.records.length,
          records: result.records,
          ttl: result.ttl,
          cname: result.cname
        });

        // If we got results from this server, return them
        if (result.records.length > 0) {
          console.log(`[DNS-native] پیدا شد ${result.records.length} رکورد از ${server}`);
          return result;
        } else {
          console.log(`[DNS-native] هیچ رکوردی از ${server} پیدا نشد، امتحان سرور بعدی`);
        }
      } catch (error: any) {
        console.log(`[DNS-native] exception برای ${server}:`, error?.message || error);
        // Try next server
        continue;
      }
    }
    
    console.log(`[DNS-native] هیچ رکوردی از هیچ سروری پیدا نشد`);
    return { records: [] };
  }

  private async forwardDNS(hostname: string, node: NodeInfo): Promise<DNSRecord[]> {
    console.log(`[DNS] شروع resolve برای: ${hostname}`);
    
    const result: DNSRecord = {
      A: [],
      AAAA: [],
      TTL: undefined
    };

    let ttl: number | undefined = undefined;
    let aRecords: string[] = [];
    let aaaaRecords: string[] = [];
    let aResolveSuccess = false;
    let aaaaResolveSuccess = false;
    
    // Resolve A records
    try {
      console.log(`[DNS] تلاش برای resolve4: ${hostname}`);
      aRecords = await dns.resolve4(hostname);
      aResolveSuccess = true;
      console.log(`[DNS] resolve4 موفق شد:`, aRecords);
    } catch (err: any) {
      console.log(`[DNS] resolve4 خطا گرفت:`, err.code, err.message);
      // فقط خطاهای واقعی را log کنیم
      if (err.code !== 'ENODATA') {
        console.error(`[DNS] خطای resolve4:`, err.code, err.message);
      }
      aRecords = [];
      aResolveSuccess = false;
    }

    // Resolve AAAA records (ENODATA عادی است - یعنی دامنه IPv6 ندارد)
    try {
      console.log(`[DNS] تلاش برای resolve6: ${hostname}`);
      aaaaRecords = await dns.resolve6(hostname);
      aaaaResolveSuccess = true;
      console.log(`[DNS] resolve6 موفق شد:`, aaaaRecords);
    } catch (err: any) {
      // ENODATA یعنی دامنه IPv6 ندارد - این عادی است
      if (err.code === 'ENODATA') {
        console.log(`[DNS] resolve6 ENODATA (دامنه IPv6 ندارد) - عادی است`);
        aaaaResolveSuccess = true; // این موفقیت است، نه خطا
        aaaaRecords = [];
      } else {
        console.log(`[DNS] resolve6 خطا گرفت:`, err.code, err.message);
        aaaaRecords = [];
        aaaaResolveSuccess = false;
      }
    }

    console.log(`[DNS] وضعیت نهایی بعد از Node.js resolver:`, {
      aResolveSuccess,
      aaaaResolveSuccess,
      aRecordsLength: aRecords.length,
      aaaaRecordsLength: aaaaRecords.length,
      aRecords: aRecords,
      aaaaRecords: aaaaRecords
    });

    // اگر resolve4 موفق شد (حتی اگر نتیجه خالی باشد)، از آن استفاده کنیم
    if (aResolveSuccess) {
      console.log(`[DNS] استفاده از نتایج Node.js resolver`);
      result.A = aRecords;
      result.AAAA = aaaaRecords;
      
      // Try to get TTL using native-dns (optional)
      if (nativeDns && aRecords.length > 0) {
        console.log(`[DNS] تلاش برای دریافت TTL با native-dns`);
        try {
          const ttlResult = await this.queryNativeDNS(hostname, 'A');
          console.log(`[DNS] نتیجه TTL query:`, ttlResult);
          if (ttlResult.ttl) {
            ttl = ttlResult.ttl;
          }
        } catch (e) {
          console.log(`[DNS] خطا در دریافت TTL:`, e);
        }
      }
    } else {
      // فقط اگر resolve4 واقعاً خطا داد، از native-dns استفاده کنیم
      console.log(`[DNS] Node.js resolver خطا داد، استفاده از native-dns`);
      try {
        console.log(`[DNS] شروع queryNativeDNS برای A`);
        const aResult = await this.queryNativeDNS(hostname, 'A');
        console.log(`[DNS] نتیجه queryNativeDNS برای A:`, {
          recordsCount: aResult.records.length,
          records: aResult.records,
          ttl: aResult.ttl,
          cname: aResult.cname
        });
        
        if (aResult.records.length > 0) {
          result.A = aResult.records.map((r: any) => r.address);
          console.log(`[DNS] تنظیم result.A از native-dns:`, result.A);
          if (aResult.ttl) {
            ttl = aResult.ttl;
          }
        }
        
        // اگر CNAME پیدا شد اما A record نیست، CNAME را resolve کنیم
        if (aResult.cname && result.A.length === 0) {
          console.log(`[DNS] پیدا شد CNAME اما A record نیست، تلاش برای resolve CNAME: ${aResult.cname}`);
          try {
            const cnameARecords = await dns.resolve4(aResult.cname);
            console.log(`[DNS] نتیجه resolve CNAME:`, cnameARecords);
            if (cnameARecords && cnameARecords.length > 0) {
              result.A = cnameARecords;
              console.log(`[DNS] تنظیم result.A از CNAME:`, result.A);
            }
          } catch (e) {
            console.log(`[DNS] خطا در resolve CNAME:`, e);
          }
        }
        
        // AAAA را هم امتحان کنیم
        if (aaaaResolveSuccess === false) {
          console.log(`[DNS] شروع queryNativeDNS برای AAAA`);
          const aaaaResult = await this.queryNativeDNS(hostname, 'AAAA');
          console.log(`[DNS] نتیجه queryNativeDNS برای AAAA:`, {
            recordsCount: aaaaResult.records.length,
            records: aaaaResult.records,
            ttl: aaaaResult.ttl
          });
          
          if (aaaaResult.records.length > 0) {
            result.AAAA = aaaaResult.records.map((r: any) => r.address);
            console.log(`[DNS] تنظیم result.AAAA از native-dns:`, result.AAAA);
            if (!ttl && aaaaResult.ttl) {
              ttl = aaaaResult.ttl;
            }
          }
        } else {
          // اگر resolve6 موفق بود، از آن استفاده کنیم
          result.AAAA = aaaaRecords;
        }
      } catch (err: any) {
        console.error(`[DNS] خطا در resolve با native-dns برای ${hostname}:`, err.message, err.code);
      }
    }

    // Set TTL if we found it
    if (ttl !== undefined) {
      result.TTL = ttl;
      console.log(`[DNS] تنظیم TTL:`, ttl);
    }

    console.log(`[DNS] نتیجه نهایی برای ${hostname}:`, {
      A: result.A,
      AAAA: result.AAAA,
      TTL: result.TTL,
      ALength: result.A.length,
      AAAALength: result.AAAA.length
    });

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
