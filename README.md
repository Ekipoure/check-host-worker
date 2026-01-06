Check-Host Agent

A simple agent for executing network checks — written in TypeScript.

Architecture

The Agent is a lightweight worker that:

✅ Receives tasks from the main server

✅ Executes network checks

✅ Sends results back to the main server

❌ Has no public API endpoints

❌ Has no database

❌ Does not store results

Installation
# Clone repository
git clone https://github.com/Ekipoure/check-host-worker.git
cd check-host-worker

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env and set AGENT_ID and other variables

# Build project
npm run build

Installing the Agent on a Server
# Install Agent using PM2
npm run agent:install

# Or manually:
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable auto-start on boot

API Endpoints
Execute Task
POST /task/execute
Content-Type: application/json
X-API-Key: your-api-key (optional)

{
  "taskId": "unique-task-id",
  "checkType": "ping|http|tcp|udp|dns|ip-info|whois|subnet-calculator",
  "host": "google.com",
  "options": {}
}


Response:

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

Health Check
GET /health

Agent Info
GET /info

How It Works

Main Server receives a check request from the user

Main Server dispatches the task to available Agents

Agent executes the check

Agent sends the result back to the main server

Main Server aggregates and stores the results in the database

Main Server displays the results to the user

Project Structure
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

Configuration
Environment Variables

AGENT_ID – Unique Agent identifier (required – automatically generated during installation)

AGENT_NAME – Agent name (required)

AGENT_LOCATION – Geographic location

AGENT_COUNTRY_CODE – Country code

AGENT_COUNTRY – Country name

AGENT_CITY – City name

AGENT_IP – Agent IP address

AGENT_ASN – ASN number

API_KEY – API key for security (optional)

If set, the website must configure the same key as WORKER_API_KEY

Requests must include the X-API-Key header

PORT – Agent port (default: 8000)

HOST – Agent host (default: 0.0.0.0)

Website Integration

To properly connect the worker with the website:

In worker (.env):

API_KEY=your-secret-key-here
PORT=8000


In web (.env):

WORKER_API_URL=http://localhost:8000
WORKER_API_KEY=your-secret-key-here


Note: WORKER_API_KEY in the web app must match API_KEY in the worker.

Agent Management
# Check status
pm2 status

# View logs
pm2 logs check-host-worker

# Restart
pm2 restart check-host-worker

# Stop
pm2 stop check-host-worker

# Uninstall Agent
npm run agent:uninstall

API Usage Examples
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

License

MIT
