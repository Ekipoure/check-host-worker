"""
DNS Service - Perform DNS resolution checks
"""
import dns.resolver
import dns.reversename
import asyncio
from typing import List, Dict, Optional
from models.schemas import DNSRecord, NodeInfo
from utils.helpers import is_valid_ip


class DNSService:
    """Service for performing DNS resolution checks"""
    
    def __init__(self):
        self.timeout = 5  # Timeout in seconds
    
    async def resolve_dns(self, host: str, node: NodeInfo) -> List[Dict]:
        """Resolve DNS for host from a specific node"""
        # If it's an IP, do reverse DNS lookup
        if is_valid_ip(host):
            return await self._reverse_dns(host, node)
        
        # Regular DNS lookup
        return await self._forward_dns(host, node)
    
    async def _forward_dns(self, hostname: str, node: NodeInfo) -> List[Dict]:
        """Perform forward DNS lookup (A and AAAA records)"""
        result = {
            "A": [],
            "AAAA": [],
            "TTL": None
        }
        
        try:
            # Resolve A records (IPv4)
            loop = asyncio.get_event_loop()
            a_records = await loop.run_in_executor(
                None,
                lambda: dns.resolver.resolve(hostname, 'A', lifetime=self.timeout)
            )
            
            result["A"] = [str(rdata) for rdata in a_records]
            if a_records.rrset:
                result["TTL"] = a_records.rrset.ttl
        
        except Exception as e:
            print(f"Error resolving A records: {e}")
        
        try:
            # Resolve AAAA records (IPv6)
            loop = asyncio.get_event_loop()
            aaaa_records = await loop.run_in_executor(
                None,
                lambda: dns.resolver.resolve(hostname, 'AAAA', lifetime=self.timeout)
            )
            
            result["AAAA"] = [str(rdata) for rdata in aaaa_records]
            if not result["TTL"] and aaaa_records.rrset:
                result["TTL"] = aaaa_records.rrset.ttl
        
        except Exception as e:
            print(f"Error resolving AAAA records: {e}")
        
        return [result]
    
    async def _reverse_dns(self, ip: str, node: NodeInfo) -> List[Dict]:
        """Perform reverse DNS lookup (PTR record)"""
        result = {
            "A": [],
            "AAAA": [],
            "TTL": None
        }
        
        try:
            # Create reverse DNS name
            loop = asyncio.get_event_loop()
            rev_name = await loop.run_in_executor(
                None,
                lambda: dns.reversename.from_address(ip)
            )
            
            # Resolve PTR record
            ptr_records = await loop.run_in_executor(
                None,
                lambda: dns.resolver.resolve(rev_name, 'PTR', lifetime=self.timeout)
            )
            
            # Store hostname in A field (for display purposes)
            result["A"] = [str(rdata) for rdata in ptr_records]
            if ptr_records.rrset:
                result["TTL"] = ptr_records.rrset.ttl
        
        except Exception as e:
            print(f"Error resolving PTR record: {e}")
        
        return [result]
    
    async def resolve_from_nodes(self, host: str, nodes: Dict[str, NodeInfo]) -> Dict[str, List[Dict]]:
        """Resolve DNS from multiple nodes"""
        tasks = {
            node_id: self.resolve_dns(host, node)
            for node_id, node in nodes.items()
        }
        
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        
        return {
            f"{node_id}.node.check-host.net": result
            if not isinstance(result, Exception) else [{"A": [], "AAAA": [], "TTL": None}]
            for node_id, result in zip(tasks.keys(), results)
        }

