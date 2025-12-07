# Check-Host Agent

Agent ساده برای اجرای network checks - نوشته شده با TypeScript

## معماری

Agent یک Worker ساده است که:
- ✅ درخواست task از سرور اصلی دریافت می‌کند
- ✅ check را اجرا می‌کند
- ✅ نتیجه را به سرور اصلی برمی‌گرداند
- ❌ API endpoints عمومی ندارد
- ❌ Database ندارد
- ❌ نتایج را ذخیره نمی‌کند

## نصب

```bash
# Clone repository
git clone https://github.com/Ekipoure/check-host-worker.git
cd check-host-worker

# نصب dependencies
npm install

# تنظیم environment variables
cp .env.example .env
# ویرایش .env و تنظیم AGENT_ID و سایر متغیرها

# Build project
npm run build
```

## نصب Agent روی سرور

```bash
# نصب Agent با PM2
npm run agent:install

# یا دستی:
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # برای startup خودکار
```

## API Endpoints

### Execute Task
```bash
POST /task/execute
Content-Type: application/json
X-API-Key: your-api-key (optional)

{
  "taskId": "unique-task-id",
  "checkType": "ping|http|tcp|udp|dns|ip-info|whois|subnet-calculator",
  "host": "google.com",
  "options": {}
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "unique-task-id",
  "checkType": "ping",
  "host": "google.com",
  "agentId": "agent-001",
  "nodeId": "agent-001.node.check-host.net",
  "result": [...],
  "timestamp": "2025-12-06T..."
}
```

### Health Check
```bash
GET /health
```

### Agent Info
```bash
GET /info
```

## نحوه کار

1. **سرور اصلی** درخواست check را از کاربر دریافت می‌کند
2. **سرور اصلی** task را به Agent ها ارسال می‌کند
3. **Agent** check را اجرا می‌کند
4. **Agent** نتیجه را به سرور اصلی برمی‌گرداند
5. **سرور اصلی** نتایج را جمع‌آوری و در دیتابیس ذخیره می‌کند
6. **سرور اصلی** نتایج را به کاربر نمایش می‌دهد

## ساختار پروژه

```
worker/
├── src/
│   ├── routes/
│   │   └── task.ts          # Task execution endpoint
│   ├── services/            # Check services
│   ├── types/               # TypeScript types
│   ├── utils/               # Helper functions
│   └── index.ts             # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## تنظیمات

### Environment Variables

- `AGENT_ID` - شناسه یکتا Agent (required - به صورت خودکار توسط سیستم نصب تولید می‌شود)
- `AGENT_NAME` - نام Agent (required)
- `AGENT_LOCATION` - موقعیت جغرافیایی
- `AGENT_COUNTRY_CODE` - کد کشور
- `AGENT_COUNTRY` - نام کشور
- `AGENT_CITY` - نام شهر
- `AGENT_IP` - IP آدرس Agent
- `AGENT_ASN` - شماره ASN
- `API_KEY` - API key برای امنیت (optional)
  - اگر تنظیم شود، وب‌سایت باید همین key را در `WORKER_API_KEY` تنظیم کند
  - درخواست‌ها باید header `X-API-Key` را داشته باشند
- `PORT` - Port برای Agent (default: 8000)
- `HOST` - Host برای Agent (default: 0.0.0.0)

### ارتباط با وب‌سایت

برای ارتباط صحیح بین worker و وب‌سایت:

1. **در worker** (`.env`):
   ```env
   API_KEY=your-secret-key-here
   PORT=8000
   ```

2. **در web** (`.env`):
   ```env
   WORKER_API_URL=http://localhost:8000
   WORKER_API_KEY=your-secret-key-here
   ```

نکته: `WORKER_API_KEY` در web باید با `API_KEY` در worker یکسان باشد.

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

## مثال استفاده از API

```bash
# Ping check
curl -X POST http://agent-server:8000/task/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "taskId": "task-123",
    "checkType": "ping",
    "host": "google.com"
  }'

# HTTP check
curl -X POST http://agent-server:8000/task/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-124",
    "checkType": "http",
    "host": "https://google.com"
  }'
```

## License

MIT
