# Check-Host Worker

Worker API برای سرویس بررسی IP، Ping، HTTP، DNS و Port Checks

## ویژگی‌ها

- ✅ **IP Geolocation** - اطلاعات جغرافیایی IP از چندین منبع
- ✅ **Ping Check** - بررسی reachability و latency از چندین node
- ✅ **HTTP/HTTPS Check** - بررسی performance وب‌سایت‌ها
- ✅ **DNS Check** - بررسی DNS resolution از چندین nameserver
- ✅ **TCP/UDP Port Check** - بررسی اتصال به port های مختلف
- ✅ **Whois Lookup** - اطلاعات whois دامنه‌ها
- ✅ **Subnet Calculator** - تبدیل IP range به CIDR و بالعکس

## نصب

```bash
# نصب dependencies
pip install -r requirements.txt

# کپی فایل env
cp .env.example .env

# ویرایش فایل .env و تنظیم API keys (اختیاری)
```

## اجرا

```bash
# اجرای سرویس
python main.py

# یا با uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Ping Check
```bash
GET /check-ping?host=google.com&max_nodes=3
```

### HTTP Check
```bash
GET /check-http?host=https://google.com&max_nodes=3
```

### TCP Port Check
```bash
GET /check-tcp?host=google.com:443&max_nodes=3
```

### UDP Port Check
```bash
GET /check-udp?host=8.8.8.8:53&max_nodes=3
```

### DNS Check
```bash
GET /check-dns?host=google.com&max_nodes=3
```

### IP Info
```bash
GET /ip-info?host=8.8.8.8
```

### Whois
```bash
GET /whois?domain=google.com
```

### Subnet Calculator
```bash
GET /subnet-calculator?input=192.168.1.0-192.168.1.255
GET /subnet-calculator?input=192.168.1.0/24
```

### Get Results
```bash
GET /check-result/{request_id}
GET /check-result-extended/{request_id}
```

### Nodes
```bash
GET /nodes/ips
GET /nodes/hosts
```

## ساختار پروژه

```
worker/
├── api/
│   └── routes.py              # API endpoints
├── config/
│   └── nodes.json             # Node configuration
├── models/
│   └── schemas.py             # Data models
├── nodes/
│   └── node_manager.py        # Node management
├── services/
│   ├── ip_geolocation.py      # IP geolocation
│   ├── ping_service.py        # Ping checks
│   ├── http_service.py        # HTTP checks
│   ├── dns_service.py         # DNS resolution
│   ├── port_check_service.py  # Port checks
│   ├── whois_service.py       # Whois lookups
│   └── subnet_calculator.py   # Subnet calculations
├── storage/
│   └── result_storage.py      # Result storage
├── utils/
│   └── helpers.py             # Helper functions
├── main.py                    # FastAPI application
├── requirements.txt           # Dependencies
└── README.md                  # Documentation
```

## تنظیمات

### Environment Variables

- `API_HOST`: Host برای API (default: 0.0.0.0)
- `API_PORT`: Port برای API (default: 8000)
- `BASE_URL`: Base URL برای permanent links
- `IPAPI_KEY`: API key برای ipapi.co (اختیاری)
- `IPGEOLOCATION_API_KEY`: API key برای ipgeolocation.io (اختیاری)
- `IPINFO_API_KEY`: API key برای ipinfo.io (اختیاری)

### Node Configuration

فایل `config/nodes.json` شامل تنظیمات node های مختلف است. می‌توانید node های جدید اضافه کنید.

## مثال استفاده

### Python
```python
import requests

# Ping check
response = requests.get("http://localhost:8000/check-ping?host=google.com")
data = response.json()
request_id = data["request_id"]

# Get results
results = requests.get(f"http://localhost:8000/check-result/{request_id}")
print(results.json())
```

### cURL
```bash
# Ping check
curl "http://localhost:8000/check-ping?host=google.com&max_nodes=3"

# Get results
curl "http://localhost:8000/check-result/{request_id}"
```

## نکات مهم

1. **Node Management**: در حال حاضر node ها به صورت local اجرا می‌شوند. برای production باید node های واقعی در سرورهای مختلف تنظیم شوند.

2. **Result Storage**: در حال حاضر از in-memory storage استفاده می‌شود. برای production بهتر است از Redis استفاده شود.

3. **Rate Limiting**: در حال حاضر rate limiting پیاده‌سازی نشده است. برای production باید اضافه شود.

4. **Error Handling**: Error handling پایه پیاده‌سازی شده است. می‌توانید بهبود دهید.

## توسعه

برای اضافه کردن سرویس جدید:

1. فایل سرویس جدید در `services/` ایجاد کنید
2. Route جدید در `api/routes.py` اضافه کنید
3. Schema جدید در `models/schemas.py` اضافه کنید (در صورت نیاز)

## License

MIT
