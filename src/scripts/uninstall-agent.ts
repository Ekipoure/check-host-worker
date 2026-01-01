/**
 * Agent Uninstallation Script
 */
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function uninstallAgent() {
  console.log('🗑️  Uninstalling Check-Host Worker Agent...\n');

  try {
    // Stop and delete PM2 process
    try {
      await execAsync('pm2 stop check-host-worker');
      await execAsync('pm2 delete check-host-worker');
      await execAsync('pm2 save');
      console.log('✅ Agent removed from PM2');
    } catch (error: any) {
      if (!error.message.includes('not found')) {
        throw error;
      }
      console.log('ℹ️  Agent not found in PM2');
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




































