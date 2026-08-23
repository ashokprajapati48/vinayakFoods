import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import pkg from 'passport-jwt';
const { ExtractJwt, Strategy } = pkg;
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { JwtPayload } from '../auth.service.js';

function accessTokenFromCookie(request: { headers?: { cookie?: string } }): string | null {
  const value = request.headers?.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('access_token='));
  return value ? value.slice('access_token='.length) : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // The cookie is the standard browser path. Bearer support remains useful
      // for non-browser API clients and does not affect browser token secrecy.
      jwtFromRequest: ExtractJwt.fromExtractors([
        accessTokenFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
