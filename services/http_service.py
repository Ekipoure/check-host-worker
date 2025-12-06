"""
HTTP Service - Perform HTTP/HTTPS checks
"""
import aiohttp
import asyncio
from typing import List, Dict, Optional
from models.schemas import NodeInfo
from utils.helpers import parse_host_port
import time


class HTTPService:
    """Service for performing HTTP/HTTPS checks"""
    
    def __init__(self):
        self.timeout = 10  # Timeout in seconds
    
    async def check_http(self, url: str, node: NodeInfo) -> List[List]:
        """Check HTTP/HTTPS URL from a specific node"""
        try:
            # Parse URL
            if not url.startswith(("http://", "https://")):
                url = f"http://{url}"
            
            start_time = time.time()
            
            async with aiohttp.ClientSession() as session:
                try:
                    async with session.get(
                        url,
                        timeout=aiohttp.ClientTimeout(total=self.timeout),
                        allow_redirects=True
                    ) as response:
                        elapsed = time.time() - start_time
                        
                        # Get resolved IP (from connection)
                        ip = None
                        if hasattr(response.connection, 'peername'):
                            ip = response.connection.peername[0]
                        
                        return [[
                            1,  # success
                            round(elapsed, 3),
                            response.reason or "OK",
                            str(response.status),
                            ip or ""
                        ]]
                
                except asyncio.TimeoutError:
                    elapsed = time.time() - start_time
                    return [[0, round(elapsed, 3), "Connection timeout", None, None]]
                
                except aiohttp.ClientError as e:
                    elapsed = time.time() - start_time
                    error_msg = str(e)
                    return [[0, round(elapsed, 3), error_msg, None, None]]
        
        except Exception as e:
            return [[0, 0.0, str(e), None, None]]
    
    async def check_from_nodes(self, url: str, nodes: Dict[str, NodeInfo]) -> Dict[str, List[List]]:
        """Check HTTP/HTTPS from multiple nodes"""
        tasks = {
            node_id: self.check_http(url, node)
            for node_id, node in nodes.items()
        }
        
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        
        return {
            f"{node_id}.node.check-host.net": result
            if not isinstance(result, Exception) else [[0, 0.0, str(result), None, None]]
            for node_id, result in zip(tasks.keys(), results)
        }

