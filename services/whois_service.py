"""
Whois Service - Perform whois lookups
"""
import whois
import asyncio
from typing import Optional, Dict, Any
from utils.helpers import is_valid_ip


class WhoisService:
    """Service for performing whois lookups"""
    
    async def get_whois(self, domain_or_ip: str) -> Optional[Dict[str, Any]]:
        """Get whois information for domain or IP"""
        try:
            loop = asyncio.get_event_loop()
            w = await loop.run_in_executor(
                None,
                lambda: whois.whois(domain_or_ip)
            )
            
            if w:
                return {
                    "domain": w.domain,
                    "registrar": w.registrar,
                    "creation_date": str(w.creation_date) if w.creation_date else None,
                    "expiration_date": str(w.expiration_date) if w.expiration_date else None,
                    "updated_date": str(w.updated_date) if w.updated_date else None,
                    "name_servers": w.name_servers if w.name_servers else [],
                    "status": w.status if w.status else [],
                    "emails": w.emails if w.emails else [],
                    "org": w.org,
                    "country": w.country,
                }
        except Exception as e:
            print(f"Error getting whois: {e}")
            return None
        
        return None

