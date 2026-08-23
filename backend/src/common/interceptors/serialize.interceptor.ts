import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Prisma } from '@prisma/client';

/**
 * Prisma returns `Decimal` columns (price, total, amount, salary, creditBalance …)
 * as Decimal objects, which JSON.stringify renders as strings ("160").
 * The clients treat those fields as numbers, so `sum + order.total` used to
 * concatenate strings and `.toFixed()` threw. Convert them once, here.
 */
function isDecimal(value: object): boolean {
  if (typeof Prisma?.Decimal?.isDecimal === 'function') {
    return Prisma.Decimal.isDecimal(value);
  }
  return (
    typeof (value as { toNumber?: unknown }).toNumber === 'function' &&
    (value as { constructor?: { name?: string } }).constructor?.name ===
      'Decimal'
  );
}

function normalize(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'bigint' ? Number(value) : value;
  }

  if (value instanceof Date || value instanceof Buffer) return value;
  if (isDecimal(value)) return Number(value);

  // Guard against the (unlikely) cyclic result set instead of blowing the stack.
  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => normalize(item, seen));

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = normalize(item, seen);
  }
  return result;
}

/** Exported so the WebSocket gateway can normalize payloads the same way. */
export function normalizeDecimals<T>(payload: T): T {
  return normalize(payload, new WeakSet()) as T;
}

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => normalizeDecimals(data)));
  }
}
