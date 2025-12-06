"""
Helper utility functions
"""
import uuid
import ipaddress
import re
from typing import Optional, Tuple


def generate_request_id() -> str:
    """Generate a unique request ID"""
    return uuid.uuid4().hex[:12]


def is_valid_ip(ip: str) -> bool:
    """Check if string is a valid IP address"""
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False


def is_valid_hostname(hostname: str) -> bool:
    """Check if string is a valid hostname"""
    if len(hostname) > 253:
        return False
    if hostname[-1] == ".":
        hostname = hostname[:-1]
    allowed = re.compile(r"^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$", re.IGNORECASE)
    return allowed.match(hostname) is not None


def parse_host_port(host: str) -> Tuple[str, Optional[int]]:
    """Parse host:port format"""
    if "://" in host:
        # Remove protocol (http://, https://, etc.)
        host = host.split("://", 1)[1]
    
    if ":" in host:
        parts = host.rsplit(":", 1)
        try:
            port = int(parts[1])
            return parts[0], port
        except ValueError:
            return host, None
    
    return host, None


def ip_range_to_cidr(start_ip: str, end_ip: str) -> Optional[str]:
    """Convert IP range to CIDR notation"""
    try:
        start = ipaddress.IPv4Address(start_ip)
        end = ipaddress.IPv4Address(end_ip)
        
        # Find the network that contains both IPs
        for prefix_len in range(32, -1, -1):
            network = ipaddress.IPv4Network(f"{start}/{prefix_len}", strict=False)
            if end in network:
                return str(network)
    except ValueError:
        pass
    
    return None


def cidr_to_ip_range(cidr: str) -> Optional[Tuple[str, str]]:
    """Convert CIDR to IP range"""
    try:
        network = ipaddress.IPv4Network(cidr, strict=False)
        return str(network.network_address), str(network.broadcast_address)
    except ValueError:
        return None


def parse_ip_range(ip_range: str) -> Optional[Tuple[str, str]]:
    """Parse IP range string (e.g., '192.168.1.0-192.168.1.255')"""
    if "-" in ip_range:
        parts = ip_range.split("-", 1)
        if len(parts) == 2:
            start, end = parts[0].strip(), parts[1].strip()
            if is_valid_ip(start) and is_valid_ip(end):
                return start, end
    
    # Try CIDR notation
    if "/" in ip_range:
        result = cidr_to_ip_range(ip_range)
        if result:
            return result
    
    return None

