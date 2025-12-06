# تحلیل کامل سایت check-host.net

## بررسی قابلیت‌های اصلی سایت

### 1. IP Info (اطلاعات IP)
- **عملکرد**: نمایش اطلاعات جغرافیایی IP یا hostname
- **داده‌های نمایش داده شده**:
  - IP address
  - Host name (reverse DNS)
  - IP range / CIDR
  - ASN (Autonomous System Number)
  - ISP / Organization
  - Country, Region, City
  - Postal Code
  - Time zone
  - Local time
- **منابع داده**:
  - DB-IP
  - IPGeolocation.io
  - IP2Location
  - MaxMind GeoIP
  - IPInfo.io
- **ویژگی‌های اضافی**:
  - نقشه جغرافیایی (Leaflet + OpenStreetMap)
  - Whois lookup
  - لینک‌های BGP (BGP.tools, HE.net, PeeringDB)

### 2. Ping Check
- **عملکرد**: تست reachability و latency از سرورهای مختلف در سراسر جهان
- **اطلاعات نمایش داده شده**:
  - Result (OK, TIMEOUT, MALFORMED)
  - RTT (Round Trip Time) - min/avg/max
  - IP address resolved
- **نحوه کار**: Ping از چندین node در کشورهای مختلف
- **API Response Format**:
  ```json
  {
    "us1.node.check-host.net": [
      ["OK", 0.044, "94.242.206.94"],
      ["TIMEOUT", 3.005],
      ["MALFORMED", 0.045],
      ["OK", 0.0433]
    ]
  }
  ```

### 3. HTTP Check
- **عملکرد**: بررسی performance و availability وب‌سایت از کشورها و datacenter های مختلف
- **پشتیبانی**: HTTP, HTTPS, با هر port
- **اطلاعات نمایش داده شده**:
  - Status code (200, 404, etc.)
  - Response time
  - Response message
  - Resolved IP address
- **API Response Format**:
  ```json
  {
    "us1.node.check-host.net": [[1, 0.13, "OK", "200", "94.242.206.94"]]
  }
  ```
  - Format: [success, time, message, status_code, ip]

### 4. DNS Check
- **عملکرد**: دریافت A, AAAA و PTR records با TTL از nameserver های مختلف
- **اطلاعات نمایش داده شده**:
  - A records (IPv4)
  - AAAA records (IPv6)
  - TTL (Time To Live)
- **API Response Format**:
  ```json
  {
    "us1.node.check-host.net": [{
      "A": ["216.58.209.174"],
      "AAAA": ["2a00:1450:400d:806::200e"],
      "TTL": 299
    }]
  }
  ```

### 5. TCP Port Check
- **عملکرد**: بررسی امکان اتصال TCP به port مشخص
- **API Response Format**:
  ```json
  {
    "us1.node.check-host.net": [{
      "time": 0.03,
      "address": "104.28.31.42"
    }]
  }
  ```

### 6. UDP Port Check
- **عملکرد**: بررسی امکان ارتباط UDP با port مشخص

### 7. Subnet Calculator
- **عملکرد**: تبدیل IP range به CIDR و بالعکس
- **مثال**: `87.250.250.0-87.250.251.255` → `87.250.250.0/23`

### 8. API Structure
- **Base URL**: `https://check-host.net/check-<TYPE>`
- **Check Types**: `ping`, `http`, `tcp`, `dns`, `udp`
- **Request Format**:
  ```
  GET /check-<TYPE>?host=<HOSTNAME>&max_nodes=<MAX_NODES>&node=<NODE>
  ```
- **Response Format**:
  ```json
  {
    "ok": 1,
    "request_id": "806df9",
    "permanent_link": "https://check-host.net/check-report/806df9",
    "nodes": {
      "us1.node.check-host.net": ["us", "USA", "Los Angeles", "5.253.30.82", "AS18978"]
    }
  }
  ```
- **Get Results**:
  ```
  GET /check-result/<REQUEST_ID>
  GET /check-result-extended/<REQUEST_ID>
  ```

### 9. Nodes Management
- **List Nodes**: `GET /nodes/ips` یا `GET /nodes/hosts`
- **Node Format**: `[country_code, country_name, city, ip, asn]`

## معماری پیشنهادی برای Worker

### ساختار Worker
```
worker/
├── services/
│   ├── ip_geolocation.py      # IP geolocation از چندین منبع
│   ├── ping_service.py         # Ping checks
│   ├── http_service.py         # HTTP/HTTPS checks
│   ├── dns_service.py          # DNS resolution
│   ├── port_check_service.py   # TCP/UDP port checks
│   ├── whois_service.py        # Whois lookups
│   └── subnet_calculator.py    # CIDR/IP range conversion
├── nodes/
│   └── node_manager.py         # مدیریت node های مختلف
├── api/
│   └── routes.py               # API endpoints
├── models/
│   └── schemas.py               # Data models
└── utils/
    └── helpers.py               # Helper functions
```

### تکنولوژی‌های پیشنهادی
- **Language**: Python 3.11+
- **Framework**: FastAPI (برای API)
- **Async**: asyncio, aiohttp
- **DNS**: dnspython
- **IP Geolocation**: 
  - ipapi.co
  - ip-api.com
  - ipgeolocation.io
  - ipinfo.io
- **Whois**: python-whois
- **Network**: socket, subprocess (برای ping)

### ویژگی‌های Worker
1. **Distributed Processing**: پردازش موازی از چندین node
2. **Real-time Results**: نتایج به صورت real-time
3. **Caching**: Cache کردن نتایج برای کاهش load
4. **Rate Limiting**: محدود کردن درخواست‌ها
5. **Error Handling**: مدیریت خطاها
6. **Logging**: لاگ کامل عملیات

