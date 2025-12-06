/**
 * IP Geolocation Service - Get IP location data from multiple sources
 */
import axios from 'axios';
import { IPGeolocationData } from '../types';
import { resolveHostname } from '../utils/helpers';

export class IPGeolocationService {
  private ipapiKey: string;
  private ipgeolocationKey: string;
  private ipinfoKey: string;

  constructor() {
    this.ipapiKey = process.env.IPAPI_KEY || '';
    this.ipgeolocationKey = process.env.IPGEOLOCATION_API_KEY || '';
    this.ipinfoKey = process.env.IPINFO_API_KEY || '';
  }

  async getIPInfo(ipOrHost: string): Promise<IPGeolocationData[]> {
    const ip = await resolveHostname(ipOrHost);
    if (!ip) {
      return [];
    }

    const tasks = [
      this.getFromIPAPI(ip),
      this.getFromIPGeolocation(ip),
      this.getFromIPInfo(ip),
      this.getFromIPAPICom(ip)
    ];

    const results = await Promise.allSettled(tasks);
    const data: IPGeolocationData[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        data.push(result.value);
      }
    }

    return data;
  }

  private async getFromIPAPI(ip: string): Promise<IPGeolocationData | null> {
    try {
      const url = `https://ipapi.co/${ip}/json/`;
      const params = this.ipapiKey ? { key: this.ipapiKey } : {};
      
      const response = await axios.get(url, { params, timeout: 5000 });
      const data = response.data;

      return {
        ip,
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        postalCode: data.postal,
        timezone: data.timezone,
        latitude: data.latitude,
        longitude: data.longitude,
        asn: data.asn,
        organization: data.org,
        isp: data.org,
        source: 'ipapi.co'
      };
    } catch (error) {
      console.error('Error getting data from ipapi.co:', error);
      return null;
    }
  }

  private async getFromIPGeolocation(ip: string): Promise<IPGeolocationData | null> {
    try {
      const url = 'https://api.ipgeolocation.io/ipgeo';
      const params: any = { ip };
      if (this.ipgeolocationKey) {
        params.apiKey = this.ipgeolocationKey;
      }

      const response = await axios.get(url, { params, timeout: 5000 });
      const data = response.data;

      return {
        ip,
        country: data.country_name,
        countryCode: data.country_code2,
        region: data.state_prov,
        city: data.city,
        postalCode: data.zipcode,
        timezone: data.time_zone?.name,
        latitude: data.latitude,
        longitude: data.longitude,
        organization: data.organization,
        isp: data.isp,
        source: 'ipgeolocation.io'
      };
    } catch (error) {
      console.error('Error getting data from ipgeolocation.io:', error);
      return null;
    }
  }

  private async getFromIPInfo(ip: string): Promise<IPGeolocationData | null> {
    try {
      const url = `https://ipinfo.io/${ip}/json`;
      const headers: any = {};
      if (this.ipinfoKey) {
        headers.Authorization = `Bearer ${this.ipinfoKey}`;
      }

      const response = await axios.get(url, { headers, timeout: 5000 });
      const data = response.data;
      
      const loc = data.loc?.split(',') || [];
      const latitude = loc[0] ? parseFloat(loc[0]) : undefined;
      const longitude = loc[1] ? parseFloat(loc[1]) : undefined;

      return {
        ip,
        hostname: data.hostname,
        country: data.country,
        region: data.region,
        city: data.city,
        postalCode: data.postal,
        timezone: data.timezone,
        latitude,
        longitude,
        organization: data.org,
        isp: data.org,
        source: 'ipinfo.io'
      };
    } catch (error) {
      console.error('Error getting data from ipinfo.io:', error);
      return null;
    }
  }

  private async getFromIPAPICom(ip: string): Promise<IPGeolocationData | null> {
    try {
      const url = `http://ip-api.com/json/${ip}`;
      const params = {
        fields: 'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query'
      };

      const response = await axios.get(url, { params, timeout: 5000 });
      const data = response.data;

      if (data.status === 'success') {
        return {
          ip,
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          city: data.city,
          postalCode: data.zip,
          timezone: data.timezone,
          latitude: data.lat,
          longitude: data.lon,
          asn: data.as,
          organization: data.org,
          isp: data.isp,
          source: 'ip-api.com'
        };
      }
    } catch (error) {
      console.error('Error getting data from ip-api.com:', error);
    }
    return null;
  }
}

