import { env } from '../config/env.js';
import { sequelize } from '../config/database.js';

export class HealthCheckService {
  static async getStatus() {
    const uptimeSeconds = Math.round(process.uptime());
    let databaseStatus;
    try {
      await sequelize.authenticate();
      databaseStatus = 'OK';
    } catch {
      databaseStatus = 'ERROR';
    }
    return {
      status: databaseStatus === 'OK' ? 'UP' : 'DEGRADED',
      application: env.appName,
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
      checks: {
        httpServer: 'OK',
        configuration: 'OK',
        database: databaseStatus,
      },
    };
  }
}
