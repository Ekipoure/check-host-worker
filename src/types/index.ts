/**
 * Type definitions for Check-Host Worker
 */

export interface NodeInfo {
  countryCode: string;
  country: string;
  city: string;
  ip: string;
  asn: string;
}

export interface CheckRequest {
  host: string;
  maxNodes?: number;
  nodes?: string[];
}

export interface CheckResponse {
  ok: number;
  requestId: string;
  permanentLink: string;
  nodes: Record<string, string[]>;
}

export interface PingResult {
  status: 'OK' | 'TIMEOUT' | 'MALFORMED';
  time?: number;
  ip?: string;
}

export interface HTTPResult {
  success: number;
  time: number;
  message: string;
  statusCode?: string;
  ip?: string;
}

export interface DNSRecord {
  A: string[];
  AAAA: string[];
  TTL?: number;
}

export interface TCPResult {
  time?: number;
  address?: string;
  error?: string;
}

export interface IPGeolocationData {
  ip: string;
  hostname?: string;
  ipRange?: string;
  cidr?: string;
  asn?: string;
  isp?: string;
  organization?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  source: string;
}

export interface SubnetInfo {
  input: string;
  ipRange?: string;
  cidr?: string;
  networkAddress?: string;
  broadcastAddress?: string;
  totalHosts?: number;
}

export interface AgentConfig {
  agentId: string;
  name: string;
  location?: string;
  countryCode?: string;
  country?: string;
  city?: string;
  ip?: string;
  asn?: string;
}


