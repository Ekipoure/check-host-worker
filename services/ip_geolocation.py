"""
IP Geolocation Service - Get IP location data from multiple sources
"""
import aiohttp
import asyncio
from typing import List, Optional, Dict, Any
from models.schemas import IPGeolocationData
from utils.helpers import is_valid_ip
import os


class IPGeolocationService:
    """Service for getting IP geolocation from multiple sources"""
    
    def __init__(self):
        self.ipapi_key = os.getenv("IPAPI_KEY", "")
        self.ipgeolocation_key = os.getenv("IPGEOLOCATION_API_KEY", "")
        self.ipinfo_key = os.getenv("IPINFO_API_KEY", "")
    
    async def get_ip_info(self, ip_or_host: str) -> List[IPGeolocationData]:
        """Get IP information from multiple sources"""
        # Resolve hostname to IP if needed
        ip = await self._resolve_hostname(ip_or_host)
        if not ip:
            return []
        
        # Get data from all sources in parallel
        tasks = [
            self._get_from_ipapi(ip),
            self._get_from_ipgeolocation(ip),
            self._get_from_ipinfo(ip),
            self._get_from_ipapi_com(ip),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out errors and None results
        data = [r for r in results if isinstance(r, IPGeolocationData)]
        
        return data
    
    async def _resolve_hostname(self, hostname: str) -> Optional[str]:
        """Resolve hostname to IP address"""
        if is_valid_ip(hostname):
            return hostname
        
        try:
            import socket
            # Try IPv4 first
            ip = socket.gethostbyname(hostname)
            return ip
        except Exception:
            return None
    
    async def _get_from_ipapi(self, ip: str) -> Optional[IPGeolocationData]:
        """Get data from ipapi.co"""
        try:
            url = f"https://ipapi.co/{ip}/json/"
            if self.ipapi_key:
                url += f"?key={self.ipapi_key}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return IPGeolocationData(
                            ip=ip,
                            country=data.get("country_name"),
                            country_code=data.get("country_code"),
                            region=data.get("region"),
                            city=data.get("city"),
                            postal_code=data.get("postal"),
                            timezone=data.get("timezone"),
                            latitude=data.get("latitude"),
                            longitude=data.get("longitude"),
                            asn=data.get("asn"),
                            organization=data.get("org"),
                            isp=data.get("org"),
                            source="ipapi.co"
                        )
        except Exception as e:
            print(f"Error getting data from ipapi.co: {e}")
        
        return None
    
    async def _get_from_ipgeolocation(self, ip: str) -> Optional[IPGeolocationData]:
        """Get data from ipgeolocation.io"""
        try:
            url = "https://api.ipgeolocation.io/ipgeo"
            params = {"ip": ip}
            if self.ipgeolocation_key:
                params["apiKey"] = self.ipgeolocation_key
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return IPGeolocationData(
                            ip=ip,
                            country=data.get("country_name"),
                            country_code=data.get("country_code2"),
                            region=data.get("state_prov"),
                            city=data.get("city"),
                            postal_code=data.get("zipcode"),
                            timezone=data.get("time_zone", {}).get("name"),
                            latitude=data.get("latitude"),
                            longitude=data.get("longitude"),
                            organization=data.get("organization"),
                            isp=data.get("isp"),
                            source="ipgeolocation.io"
                        )
        except Exception as e:
            print(f"Error getting data from ipgeolocation.io: {e}")
        
        return None
    
    async def _get_from_ipinfo(self, ip: str) -> Optional[IPGeolocationData]:
        """Get data from ipinfo.io"""
        try:
            url = f"https://ipinfo.io/{ip}/json"
            headers = {}
            if self.ipinfo_key:
                headers["Authorization"] = f"Bearer {self.ipinfo_key}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        loc = data.get("loc", "").split(",")
                        latitude = float(loc[0]) if len(loc) > 0 and loc[0] else None
                        longitude = float(loc[1]) if len(loc) > 1 and loc[1] else None
                        
                        return IPGeolocationData(
                            ip=ip,
                            hostname=data.get("hostname"),
                            country=data.get("country"),
                            region=data.get("region"),
                            city=data.get("city"),
                            postal_code=data.get("postal"),
                            timezone=data.get("timezone"),
                            latitude=latitude,
                            longitude=longitude,
                            organization=data.get("org"),
                            isp=data.get("org"),
                            source="ipinfo.io"
                        )
        except Exception as e:
            print(f"Error getting data from ipinfo.io: {e}")
        
        return None
    
    async def _get_from_ipapi_com(self, ip: str) -> Optional[IPGeolocationData]:
        """Get data from ip-api.com (free tier)"""
        try:
            url = f"http://ip-api.com/json/{ip}"
            params = {"fields": "status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query"}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if data.get("status") == "success":
                            return IPGeolocationData(
                                ip=ip,
                                country=data.get("country"),
                                country_code=data.get("countryCode"),
                                region=data.get("regionName"),
                                city=data.get("city"),
                                postal_code=data.get("zip"),
                                timezone=data.get("timezone"),
                                latitude=data.get("lat"),
                                longitude=data.get("lon"),
                                asn=data.get("as"),
                                organization=data.get("org"),
                                isp=data.get("isp"),
                                source="ip-api.com"
                            )
        except Exception as e:
            print(f"Error getting data from ip-api.com: {e}")
        
        return None

