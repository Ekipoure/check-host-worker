/**
 * Agent Uninstallation Script
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const execAsync = promisify(exec);

async function uninstallAgent() {
  console.log('🗑️  Uninstalling Check-Host Worker Agent...\n');

  try {
    // Get agent ID from environment
    const agentId = process.env.AGENT_ID;
    if (!agentId) {
      console.error('❌ Error: AGENT_ID is required but not set in .env file');
      console.error('   Please ensure AGENT_ID is set in your .env file');
      process.exit(1);
    }

    // Create unique PM2 process name based on agent ID
    const pm2ProcessName = `check-host-worker-${agentId}`;

    // Stop and delete PM2 process
    try {
      await execAsync(`pm2 stop ${pm2ProcessName}`);
      await execAsync(`pm2 delete ${pm2ProcessName}`);
      await execAsync('pm2 save');
      console.log(`✅ Agent removed from PM2 (${pm2ProcessName})`);
    } catch (error: any) {
      if (!error.message.includes('not found') && !error.message.includes('not found')) {
        throw error;
      }
      console.log(`ℹ️  Agent not found in PM2 (${pm2ProcessName})`);
    }

    console.log('✅ Agent uninstalled successfully!');
  } catch (error: any) {
    console.error('❌ Error uninstalling agent:', error.message);
    process.exit(1);
  }
}

// Run uninstallation
if (require.main === module) {
  uninstallAgent();
}

export { uninstallAgent };






































