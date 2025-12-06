# Check-Host Worker Agent

Worker Agent API برای سرویس بررسی IP، Ping، HTTP، DNS و Port Checks - نوشته شده با TypeScript و PostgreSQL

## ویژگی‌ها

- ✅ **TypeScript** - کد type-safe و maintainable
- ✅ **PostgreSQL** - Database برای ذخیره نتایج
- ✅ **Agent Installation** - نصب خودکار به عنوان system service
- ✅ **PM2 Integration** - مدیریت process با PM2
- ✅ **IP Geolocation** - اطلاعات جغرافیایی IP از چندین منبع
- ✅ **Ping Check** - بررسی reachability و latency
- ✅ **HTTP/HTTPS Check** - بررسی performance وب‌سایت‌ها
- ✅ **DNS Check** - بررسی DNS resolution
- ✅ **TCP/UDP Port Check** - بررسی اتصال به port های مختلف
- ✅ **Whois Lookup** - اطلاعات whois دامنه‌ها
- ✅ **Subnet Calculator** - تبدیل IP range به CIDR و بالعکس

## پیش‌نیازها

- Node.js 18+ 
- PostgreSQL 14+
- npm یا yarn

## نصب

```bash
# Clone repository
git clone https://github.com/Ekipoure/check-host-worker.git
cd check-host-worker

# نصب dependencies
npm install

# تنظیم environment variables
cp .env.example .env
# ویرایش .env و تنظیم DATABASE_URL و سایر متغیرها

# Setup database
npx prisma generate
npx prisma migrate dev

# Build project
npm run build
```

## نصب Agent

برای نصب Agent به عنوان system service:

```bash
# نصب Agent با PM2
npm run agent:install

# یا دستی:
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # برای startup خودکار
```

## اجرا

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### با PM2
```bash
pm2 start ecosystem.config.js
pm2 logs check-host-worker
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
├── src/
│   ├── config/          # Configuration
│   ├── database/        # Prisma client
│   ├── routes/          # API routes
│   ├── services/         # Core services
│   ├── scripts/         # Installation scripts
│   ├── storage/         # Result storage
│   ├── types/           # TypeScript types
│   ├── utils/           # Helper functions
│   └── index.ts         # Main entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── config/
│   └── nodes.json       # Node configuration
├── package.json
├── tsconfig.json
└── README.md
```

## تنظیمات

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `PORT` - Server port (default: 8000)
- `HOST` - Server host (default: 0.0.0.0)
- `BASE_URL` - Base URL for permanent links
- `AGENT_ID` - Unique agent identifier
- `AGENT_NAME` - Agent name
- `AGENT_LOCATION` - Agent location
- `AGENT_COUNTRY_CODE` - Country code
- `AGENT_COUNTRY` - Country name
- `AGENT_CITY` - City name
- `AGENT_IP` - Agent IP address
- `AGENT_ASN` - ASN number

### Database Schema

Prisma schema شامل:
- `Agent` - اطلاعات agent ها
- `CheckRequest` - درخواست‌های check
- `CheckResult` - نتایج checks
- `Node` - اطلاعات node ها

## مدیریت Agent

```bash
# مشاهده وضعیت
pm2 status

# مشاهده لاگ‌ها
pm2 logs check-host-worker

# Restart
pm2 restart check-host-worker

# Stop
pm2 stop check-host-worker

# حذف Agent
npm run agent:uninstall
```

## توسعه

```bash
# Development mode با hot reload
npm run dev

# Build
npm run build

# Database migrations
npm run migrate

# Prisma Studio (GUI برای database)
npm run studio
```

## License

MIT
