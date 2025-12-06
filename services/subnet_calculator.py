"""
Subnet Calculator Service - Convert between IP ranges and CIDR
"""
import ipaddress
from typing import Optional, Tuple
from utils.helpers import parse_ip_range, ip_range_to_cidr, cidr_to_ip_range


class SubnetCalculatorService:
    """Service for subnet calculations"""
    
    def calculate(self, input_str: str) -> dict:
        """Calculate subnet information"""
        result = {
            "input": input_str,
            "ip_range": None,
            "cidr": None,
            "network_address": None,
            "broadcast_address": None,
            "total_hosts": None
        }
        
        # Check if input is CIDR notation
        if "/" in input_str:
            # CIDR to IP range
            ip_range = cidr_to_ip_range(input_str)
            if ip_range:
                result["ip_range"] = f"{ip_range[0]}-{ip_range[1]}"
                result["cidr"] = input_str
                
                # Get network info
                try:
                    network = ipaddress.IPv4Network(input_str, strict=False)
                    result["network_address"] = str(network.network_address)
                    result["broadcast_address"] = str(network.broadcast_address)
                    result["total_hosts"] = network.num_addresses
                except ValueError:
                    pass
        
        # Check if input is IP range
        elif "-" in input_str:
            # IP range to CIDR
            ip_range = parse_ip_range(input_str)
            if ip_range:
                result["ip_range"] = input_str
                cidr = ip_range_to_cidr(ip_range[0], ip_range[1])
                if cidr:
                    result["cidr"] = cidr
                    
                    # Get network info
                    try:
                        network = ipaddress.IPv4Network(cidr, strict=False)
                        result["network_address"] = str(network.network_address)
                        result["broadcast_address"] = str(network.broadcast_address)
                        result["total_hosts"] = network.num_addresses
                    except ValueError:
                        pass
        
        return result

