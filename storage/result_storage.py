"""
Result Storage - Store and retrieve check results
"""
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import json


class ResultStorage:
    """In-memory storage for check results (can be replaced with Redis)"""
    
    def __init__(self):
        self.results: Dict[str, Dict[str, Any]] = {}
        self.expiry_time = timedelta(hours=24)  # Results expire after 24 hours
    
    def store_result(self, request_id: str, check_type: str, host: str, 
                    nodes: Dict, results: Dict[str, Any]):
        """Store check result"""
        self.results[request_id] = {
            "check_type": check_type,
            "host": host,
            "nodes": nodes,
            "results": results,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + self.expiry_time).isoformat()
        }
    
    def get_result(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Get check result by request ID"""
        if request_id not in self.results:
            return None
        
        result = self.results[request_id]
        
        # Check if expired
        expires_at = datetime.fromisoformat(result["expires_at"])
        if datetime.now() > expires_at:
            del self.results[request_id]
            return None
        
        return result
    
    def get_extended_result(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Get extended check result"""
        result = self.get_result(request_id)
        if not result:
            return None
        
        return {
            "command": result["check_type"],
            "created": int(datetime.fromisoformat(result["created_at"]).timestamp()),
            "host": result["host"],
            "results": result["results"]
        }
    
    def cleanup_expired(self):
        """Remove expired results"""
        now = datetime.now()
        expired_ids = [
            request_id
            for request_id, result in self.results.items()
            if datetime.fromisoformat(result["expires_at"]) < now
        ]
        
        for request_id in expired_ids:
            del self.results[request_id]

