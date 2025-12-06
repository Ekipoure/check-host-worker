"""
Node Manager - Manages distributed nodes for checks
"""
import json
import os
from typing import List, Dict, Optional
from pathlib import Path
from models.schemas import NodeInfo


class NodeManager:
    """Manages nodes for distributed checks"""
    
    def __init__(self, config_file: Optional[str] = None):
        if config_file is None:
            config_file = os.getenv("NODES_CONFIG_FILE", "config/nodes.json")
        
        self.config_file = config_file
        self.nodes: Dict[str, NodeInfo] = {}
        self.load_nodes()
    
    def load_nodes(self):
        """Load nodes from configuration file"""
        try:
            config_path = Path(self.config_file)
            if not config_path.exists():
                # Use default nodes if config doesn't exist
                self.nodes = self._get_default_nodes()
                return
            
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            for node_id, node_data in config.get("nodes", {}).items():
                self.nodes[node_id] = NodeInfo(**node_data)
        
        except Exception as e:
            print(f"Error loading nodes: {e}")
            self.nodes = self._get_default_nodes()
    
    def _get_default_nodes(self) -> Dict[str, NodeInfo]:
        """Get default nodes configuration"""
        return {
            "us1": NodeInfo(
                country_code="us",
                country="USA",
                city="Los Angeles",
                ip="5.253.30.82",
                asn="AS18978"
            ),
            "ir1": NodeInfo(
                country_code="ir",
                country="Iran",
                city="Tehran",
                ip="2.147.76.51",
                asn="AS58224"
            ),
            "de1": NodeInfo(
                country_code="de",
                country="Germany",
                city="Frankfurt",
                ip="46.4.143.48",
                asn="AS24940"
            ),
            "nl1": NodeInfo(
                country_code="nl",
                country="Netherlands",
                city="Amsterdam",
                ip="185.159.82.88",
                asn="AS14576"
            ),
            "ru1": NodeInfo(
                country_code="ru",
                country="Russia",
                city="Moscow",
                ip="185.159.82.88",
                asn="AS14576"
            )
        }
    
    def get_node(self, node_id: str) -> Optional[NodeInfo]:
        """Get node by ID"""
        return self.nodes.get(node_id)
    
    def get_all_nodes(self) -> Dict[str, NodeInfo]:
        """Get all nodes"""
        return self.nodes
    
    def get_nodes_list(self, max_nodes: Optional[int] = None, 
                       specific_nodes: Optional[List[str]] = None) -> Dict[str, NodeInfo]:
        """Get list of nodes to use for check"""
        if specific_nodes:
            # Return only specified nodes
            return {node_id: self.nodes[node_id] 
                   for node_id in specific_nodes 
                   if node_id in self.nodes}
        
        nodes = self.nodes.copy()
        
        if max_nodes and max_nodes < len(nodes):
            # Limit number of nodes
            node_items = list(nodes.items())[:max_nodes]
            nodes = dict(node_items)
        
        return nodes
    
    def get_nodes_for_api(self, max_nodes: Optional[int] = None,
                          specific_nodes: Optional[List[str]] = None) -> Dict[str, List]:
        """Get nodes in API format: {node_id: [country_code, country, city, ip, asn]}"""
        nodes = self.get_nodes_list(max_nodes, specific_nodes)
        return {
            f"{node_id}.node.check-host.net": [
                node.country_code,
                node.country,
                node.city,
                node.ip,
                node.asn
            ]
            for node_id, node in nodes.items()
        }

