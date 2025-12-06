"""
Port Check Service - Check TCP/UDP port connectivity
"""
import asyncio
import socket
from typing import List, Dict, Optional
from models.schemas import NodeInfo, TCPResult
from utils.helpers import parse_host_port
import time


class PortCheckService:
    """Service for checking TCP/UDP port connectivity"""
    
    def __init__(self):
        self.timeout = 5  # Timeout in seconds
    
    async def check_tcp_port(self, host: str, node: NodeInfo) -> List[Dict]:
        """Check TCP port connectivity from a specific node"""
        hostname, port = parse_host_port(host)
        
        if not port:
            # Default ports based on protocol
            if hostname.startswith("https://"):
                port = 443
            elif hostname.startswith("http://"):
                port = 80
            else:
                port = 80
        
        # Remove protocol prefix
        if "://" in hostname:
            hostname = hostname.split("://", 1)[1]
        
        # Resolve hostname
        ip = await self._resolve_hostname(hostname)
        if not ip:
            return [{"error": "Unable to resolve hostname"}]
        
        # Try to connect
        try:
            start_time = time.time()
            loop = asyncio.get_event_loop()
            
            # Create socket connection
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(self.timeout)
            
            await loop.sock_connect(sock, (ip, port))
            elapsed = time.time() - start_time
            
            sock.close()
            
            return [{
                "time": round(elapsed, 3),
                "address": ip
            }]
        
        except socket.timeout:
            return [{"error": "Connection timed out"}]
        
        except Exception as e:
            return [{"error": str(e)}]
    
    async def check_udp_port(self, host: str, node: NodeInfo) -> List[Dict]:
        """Check UDP port connectivity from a specific node"""
        hostname, port = parse_host_port(host)
        
        if not port:
            port = 53  # Default DNS port
        
        # Remove protocol prefix
        if "://" in hostname:
            hostname = hostname.split("://", 1)[1]
        
        # Resolve hostname
        ip = await self._resolve_hostname(hostname)
        if not ip:
            return [{"error": "Unable to resolve hostname"}]
        
        # Try to send UDP packet
        try:
            start_time = time.time()
            loop = asyncio.get_event_loop()
            
            # Create UDP socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(self.timeout)
            
            # Send a test packet
            await loop.sock_sendto(sock, b"test", (ip, port))
            
            # Try to receive (may timeout if port is closed)
            try:
                await asyncio.wait_for(
                    loop.sock_recvfrom(sock, 1024),
                    timeout=1.0
                )
                elapsed = time.time() - start_time
                sock.close()
                return [{"time": round(elapsed, 3), "address": ip}]
            except asyncio.TimeoutError:
                # Port might be open but not responding
                elapsed = time.time() - start_time
                sock.close()
                return [{"time": round(elapsed, 3), "address": ip, "note": "No response received"}]
        
        except Exception as e:
            return [{"error": str(e)}]
    
    async def _resolve_hostname(self, hostname: str) -> Optional[str]:
        """Resolve hostname to IP address"""
        try:
            loop = asyncio.get_event_loop()
            ip = await loop.run_in_executor(None, socket.gethostbyname, hostname)
            return ip
        except Exception:
            return None
    
    async def check_tcp_from_nodes(self, host: str, nodes: Dict[str, NodeInfo]) -> Dict[str, List[Dict]]:
        """Check TCP port from multiple nodes"""
        tasks = {
            node_id: self.check_tcp_port(host, node)
            for node_id, node in nodes.items()
        }
        
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        
        return {
            f"{node_id}.node.check-host.net": result
            if not isinstance(result, Exception) else [{"error": str(result)}]
            for node_id, result in zip(tasks.keys(), results)
        }
    
    async def check_udp_from_nodes(self, host: str, nodes: Dict[str, NodeInfo]) -> Dict[str, List[Dict]]:
        """Check UDP port from multiple nodes"""
        tasks = {
            node_id: self.check_udp_port(host, node)
            for node_id, node in nodes.items()
        }
        
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        
        return {
            f"{node_id}.node.check-host.net": result
            if not isinstance(result, Exception) else [{"error": str(result)}]
            for node_id, result in zip(tasks.keys(), results)
        }

