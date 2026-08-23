import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

export interface ServiceInfo {
  service: string;
  status: string;
  message: string;
  apiPrefix: string;
  appUrl: string;
  docs: Record<string, string>;
  timestamp: string;
}

/**
 * Hitting this server's root in a browser used to return
 * `{"statusCode":404,"message":"Cannot GET /"}`, which reads like a crash but only
 * means "this is the API, the UI lives elsewhere". Answer with something useful instead.
 */
export function serviceInfo(): ServiceInfo {
  const appUrl = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')[0]
    .trim();

  return {
    service: 'VINAYAK FOODS API',
    status: 'ok',
    message:
      'This is the backend API server. Open the app UI at the appUrl below — API routes live under /api.',
    apiPrefix: '/api',
    appUrl,
    docs: {
      health: '/api/health',
      login: 'POST /api/auth/login',
      menu: 'GET /api/menu/categories',
      orders: 'GET /api/orders',
      kitchen: 'GET /api/orders/kitchen/KITCHEN_1',
    },
    timestamp: new Date().toISOString(),
  };
}

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  /** Excluded from the global `/api` prefix — serves the bare root. */
  @Get()
  root(): ServiceInfo {
    return serviceInfo();
  }

  @Get('status')
  status(): ServiceInfo {
    return serviceInfo();
  }

  @Get('health')
  async health() {
    let database = 'up';
    let ok = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      ok = false;
      database = error instanceof Error ? `down: ${error.message}` : 'down';
    }

    return {
      status: ok ? 'ok' : 'degraded',
      database,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
