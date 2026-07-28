import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth() {
    try {
      const isConnected = this.dataSource.isInitialized;
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        database: {
          connected: isConnected,
          type: this.dataSource.options.type,
          database: this.dataSource.options.database,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: {
          connected: false,
          error: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}
