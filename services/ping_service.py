"""
Ping Service - Perform ping checks from multiple nodes
"""
import asyncio
import subprocess
import platform
from typing import List, Dict, Optional
from models.schemas import PingResult, NodeInfo
from utils.helpers import is_valid_ip, parse_host_port


class PingService:
    """Service for performing ping checks"""
    
    def __init__(self):
        self.ping_count = 4  # Number of pings to perform
        self.timeout = 3  # Timeout in seconds
    
    async def ping_host(self, host: str, node: NodeInfo) -> List[List]:
        """Ping host from a specific node"""
        hostname, port = parse_host_port(host)
        
        # Resolve hostname to IP if needed
        ip = await self._resolve_hostname(hostname)
        if not ip:
            return [[None]]  # Unable to resolve
        
        # Perform ping
        results = []
        for _ in range(self.ping_count):
            result = await self._ping_ip(ip)
            results.append(result)
        
        return [results]
    
    async def _resolve_hostname(self, hostname: str) -> Optional[str]:
        """Resolve hostname to IP address"""
        if is_valid_ip(hostname):
            return hostname
        
        try:
            import socket
            loop = asyncio.get_event_loop()
            ip = await loop.run_in_executor(None, socket.gethostbyname, hostname)
            return ip
        except Exception:
            return None
    
    async def _ping_ip(self, ip: str) -> List:
        """Ping a single IP address"""
        try:
            # Determine ping command based on OS
            system = platform.system().lower()
            if system == "windows":
                cmd = ["ping", "-n", "1", "-w", str(self.timeout * 1000), ip]
            else:
                cmd = ["ping", "-c", "1", "-W", str(self.timeout), ip]
            
            # Run ping command
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=self.timeout + 1
            )
            
            if process.returncode == 0:
                # Parse response time from output
                output = stdout.decode()
                time = self._parse_ping_time(output, system)
                if time is not None:
                    return ["OK", time, ip]
                else:
                    return ["OK", 0.0, ip]
            else:
                return ["TIMEOUT", self.timeout]
        
        except asyncio.TimeoutError:
            return ["TIMEOUT", self.timeout]
        except Exception as e:
            return ["MALFORMED", 0.0]
    
    def _parse_ping_time(self, output: str, system: str) -> Optional[float]:
        """Parse ping time from output"""
        import re
        
        if system == "windows":
            # Windows format: time=123ms or time<1ms
            match = re.search(r'time[<=](\d+)ms', output, re.IGNORECASE)
            if match:
                return float(match.group(1)) / 1000.0
        else:
            # Linux/Mac format: time=123.456 ms
            match = re.search(r'time=([\d.]+)\s*ms', output, re.IGNORECASE)
            if match:
                return float(match.group(1)) / 1000.0
        
        return None
    
    async def ping_from_nodes(self, host: str, nodes: Dict[str, NodeInfo]) -> Dict[str, List[List]]:
        """Ping host from multiple nodes"""
        tasks = {
            node_id: self.ping_host(host, node)
            for node_id, node in nodes.items()
        }
        
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        
        return {
            f"{node_id}.node.check-host.net": result
            if not isinstance(result, Exception) else [[None]]
            for node_id, result in zip(tasks.keys(), results)
        }

