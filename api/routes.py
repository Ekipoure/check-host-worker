"""
API Routes - FastAPI routes for all services
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from models.schemas import (
    CheckRequest, CheckResponse, PingCheckResponse, HTTPCheckResponse,
    DNSCheckResponse, TCPCheckResponse, IPInfoResponse, SubnetCalculatorRequest,
    SubnetCalculatorResponse
)
from nodes.node_manager import NodeManager
from services.ping_service import PingService
from services.http_service import HTTPService
from services.dns_service import DNSService
from services.port_check_service import PortCheckService
from services.ip_geolocation import IPGeolocationService
from services.whois_service import WhoisService
from services.subnet_calculator import SubnetCalculatorService
from storage.result_storage import ResultStorage
from utils.helpers import generate_request_id
import os

router = APIRouter()

# Initialize services
node_manager = NodeManager()
ping_service = PingService()
http_service = HTTPService()
dns_service = DNSService()
port_check_service = PortCheckService()
ip_geolocation_service = IPGeolocationService()
whois_service = WhoisService()
subnet_calculator_service = SubnetCalculatorService()
result_storage = ResultStorage()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


@router.get("/check-ping", response_model=CheckResponse)
async def check_ping(
    host: str = Query(..., description="Hostname or IP address"),
    max_nodes: Optional[int] = Query(None, description="Maximum number of nodes"),
    node: Optional[List[str]] = Query(None, description="Specific nodes to use")
):
    """Perform ping check"""
    request_id = generate_request_id()
    
    # Get nodes
    nodes = node_manager.get_nodes_list(max_nodes, node)
    nodes_api = node_manager.get_nodes_for_api(max_nodes, node)
    
    # Perform ping checks
    results = await ping_service.ping_from_nodes(host, nodes)
    
    # Store results
    result_storage.store_result(request_id, "ping", host, nodes_api, results)
    
    return CheckResponse(
        ok=1,
        request_id=request_id,
        permanent_link=f"{BASE_URL}/check-report/{request_id}",
        nodes=nodes_api
    )


@router.get("/check-http", response_model=CheckResponse)
async def check_http(
    host: str = Query(..., description="URL to check"),
    max_nodes: Optional[int] = Query(None, description="Maximum number of nodes"),
    node: Optional[List[str]] = Query(None, description="Specific nodes to use")
):
    """Perform HTTP/HTTPS check"""
    request_id = generate_request_id()
    
    # Get nodes
    nodes = node_manager.get_nodes_list(max_nodes, node)
    nodes_api = node_manager.get_nodes_for_api(max_nodes, node)
    
    # Perform HTTP checks
    results = await http_service.check_from_nodes(host, nodes)
    
    # Store results
    result_storage.store_result(request_id, "http", host, nodes_api, results)
    
    return CheckResponse(
        ok=1,
        request_id=request_id,
        permanent_link=f"{BASE_URL}/check-report/{request_id}",
        nodes=nodes_api
    )


@router.get("/check-tcp", response_model=CheckResponse)
async def check_tcp(
    host: str = Query(..., description="Host:port to check"),
    max_nodes: Optional[int] = Query(None, description="Maximum number of nodes"),
    node: Optional[List[str]] = Query(None, description="Specific nodes to use")
):
    """Perform TCP port check"""
    request_id = generate_request_id()
    
    # Get nodes
    nodes = node_manager.get_nodes_list(max_nodes, node)
    nodes_api = node_manager.get_nodes_for_api(max_nodes, node)
    
    # Perform TCP checks
    results = await port_check_service.check_tcp_from_nodes(host, nodes)
    
    # Store results
    result_storage.store_result(request_id, "tcp", host, nodes_api, results)
    
    return CheckResponse(
        ok=1,
        request_id=request_id,
        permanent_link=f"{BASE_URL}/check-report/{request_id}",
        nodes=nodes_api
    )


@router.get("/check-udp", response_model=CheckResponse)
async def check_udp(
    host: str = Query(..., description="Host:port to check"),
    max_nodes: Optional[int] = Query(None, description="Maximum number of nodes"),
    node: Optional[List[str]] = Query(None, description="Specific nodes to use")
):
    """Perform UDP port check"""
    request_id = generate_request_id()
    
    # Get nodes
    nodes = node_manager.get_nodes_list(max_nodes, node)
    nodes_api = node_manager.get_nodes_for_api(max_nodes, node)
    
    # Perform UDP checks
    results = await port_check_service.check_udp_from_nodes(host, nodes)
    
    # Store results
    result_storage.store_result(request_id, "udp", host, nodes_api, results)
    
    return CheckResponse(
        ok=1,
        request_id=request_id,
        permanent_link=f"{BASE_URL}/check-report/{request_id}",
        nodes=nodes_api
    )


@router.get("/check-dns", response_model=CheckResponse)
async def check_dns(
    host: str = Query(..., description="Hostname or IP address"),
    max_nodes: Optional[int] = Query(None, description="Maximum number of nodes"),
    node: Optional[List[str]] = Query(None, description="Specific nodes to use")
):
    """Perform DNS check"""
    request_id = generate_request_id()
    
    # Get nodes
    nodes = node_manager.get_nodes_list(max_nodes, node)
    nodes_api = node_manager.get_nodes_for_api(max_nodes, node)
    
    # Perform DNS checks
    results = await dns_service.resolve_from_nodes(host, nodes)
    
    # Store results
    result_storage.store_result(request_id, "dns", host, nodes_api, results)
    
    return CheckResponse(
        ok=1,
        request_id=request_id,
        permanent_link=f"{BASE_URL}/check-report/{request_id}",
        nodes=nodes_api
    )


@router.get("/check-result/{request_id}")
async def get_check_result(request_id: str):
    """Get check results"""
    result = result_storage.get_result(request_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    return result["results"]


@router.get("/check-result-extended/{request_id}")
async def get_check_result_extended(request_id: str):
    """Get extended check results"""
    result = result_storage.get_extended_result(request_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    return result


@router.get("/ip-info", response_model=IPInfoResponse)
async def get_ip_info(host: str = Query(..., description="IP address or hostname")):
    """Get IP geolocation information"""
    sources = await ip_geolocation_service.get_ip_info(host)
    
    if not sources:
        raise HTTPException(status_code=404, detail="Unable to get IP information")
    
    return IPInfoResponse(
        ip=sources[0].ip if sources else host,
        sources=sources
    )


@router.get("/whois")
async def get_whois(domain: str = Query(..., description="Domain or IP address")):
    """Get whois information"""
    result = await whois_service.get_whois(domain)
    if not result:
        raise HTTPException(status_code=404, detail="Unable to get whois information")
    
    return result


@router.get("/subnet-calculator", response_model=SubnetCalculatorResponse)
async def subnet_calculator(input: str = Query(..., description="IP range or CIDR")):
    """Calculate subnet information"""
    result = subnet_calculator_service.calculate(input)
    return SubnetCalculatorResponse(**result)


@router.get("/nodes/ips")
async def get_nodes_ips():
    """Get list of nodes with IPs"""
    nodes = node_manager.get_all_nodes()
    return {
        "nodes": {
            f"{node_id}.node.check-host.net": {
                "ip": node.ip,
                "asn": node.asn,
                "location": [node.country_code, node.country, node.city]
            }
            for node_id, node in nodes.items()
        }
    }


@router.get("/nodes/hosts")
async def get_nodes_hosts():
    """Get list of nodes with hostnames"""
    nodes = node_manager.get_all_nodes()
    return {
        "nodes": {
            f"{node_id}.node.check-host.net": {
                "asn": node.asn,
                "ip": node.ip,
                "location": [node.country_code, node.country, node.city]
            }
            for node_id, node in nodes.items()
        }
    }

