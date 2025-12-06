"""
Data models and schemas for the check-ip worker
"""
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime


class NodeInfo(BaseModel):
    """Node information"""
    country_code: str
    country: str
    city: str
    ip: str
    asn: str


class CheckRequest(BaseModel):
    """Base check request"""
    host: str = Field(..., description="Hostname or IP address")
    max_nodes: Optional[int] = Field(None, description="Maximum number of nodes")
    nodes: Optional[List[str]] = Field(None, description="Specific nodes to use")


class CheckResponse(BaseModel):
    """Base check response"""
    ok: int = Field(1, description="Status (1 = success)")
    request_id: str = Field(..., description="Unique request identifier")
    permanent_link: str = Field(..., description="Permanent link to results")
    nodes: Dict[str, List[Union[str, NodeInfo]]] = Field(..., description="Nodes information")


class PingResult(BaseModel):
    """Ping result"""
    status: str = Field(..., description="OK, TIMEOUT, MALFORMED")
    time: Optional[float] = Field(None, description="Response time in seconds")
    ip: Optional[str] = Field(None, description="Resolved IP address")


class PingCheckResponse(BaseModel):
    """Ping check results"""
    node: str
    results: List[List[Union[str, float]]]


class HTTPResult(BaseModel):
    """HTTP check result"""
    success: int = Field(..., description="1 = success, 0 = failure")
    time: float = Field(..., description="Response time in seconds")
    message: str = Field(..., description="Response message")
    status_code: Optional[str] = Field(None, description="HTTP status code")
    ip: Optional[str] = Field(None, description="Resolved IP address")


class HTTPCheckResponse(BaseModel):
    """HTTP check results"""
    node: str
    results: List[List[Union[int, float, str]]]


class DNSRecord(BaseModel):
    """DNS record"""
    A: List[str] = Field(default_factory=list, description="IPv4 addresses")
    AAAA: List[str] = Field(default_factory=list, description="IPv6 addresses")
    TTL: Optional[int] = Field(None, description="Time to live")


class DNSCheckResponse(BaseModel):
    """DNS check results"""
    node: str
    results: List[DNSRecord]


class TCPResult(BaseModel):
    """TCP check result"""
    time: Optional[float] = Field(None, description="Connection time")
    address: Optional[str] = Field(None, description="Connected IP address")
    error: Optional[str] = Field(None, description="Error message if failed")


class TCPCheckResponse(BaseModel):
    """TCP check results"""
    node: str
    results: List[TCPResult]


class IPGeolocationData(BaseModel):
    """IP geolocation data"""
    ip: str
    hostname: Optional[str] = None
    ip_range: Optional[str] = None
    cidr: Optional[str] = None
    asn: Optional[str] = None
    isp: Optional[str] = None
    organization: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    timezone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source: str = Field(..., description="Data source name")


class IPInfoResponse(BaseModel):
    """IP info response"""
    ip: str
    sources: List[IPGeolocationData] = Field(..., description="Data from multiple sources")


class SubnetCalculatorRequest(BaseModel):
    """Subnet calculator request"""
    input: str = Field(..., description="IP range (e.g., 192.168.1.0-192.168.1.255) or CIDR (e.g., 192.168.1.0/24)")


class SubnetCalculatorResponse(BaseModel):
    """Subnet calculator response"""
    input: str
    ip_range: Optional[str] = None
    cidr: Optional[str] = None
    network_address: Optional[str] = None
    broadcast_address: Optional[str] = None
    total_hosts: Optional[int] = None

