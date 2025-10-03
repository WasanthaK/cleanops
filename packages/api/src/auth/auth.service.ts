/**
 * Authentication service responsible for verifying credentials and issuing JWTs.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { Worker } from '@prisma/client';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async validateWorker(email: string, password: string): Promise<Worker> {
    const worker = await this.prisma.worker.findUnique({ where: { email } });
    if (!worker) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, worker.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return worker;
  }

  async issueTokens(worker: Worker) {
    const payload: JwtPayload = {
      sub: worker.id,
      email: worker.email,
      role: worker.role
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<number>('jwt.accessTtl')
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<number>('jwt.refreshTtl')
    });

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const worker = await this.validateWorker(email, password);
    return this.issueTokens(worker);
  }

  async refresh(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>('jwt.refreshSecret')
      });
      const worker = await this.prisma.worker.findUnique({ where: { id: payload.sub } });
      if (!worker) {
        throw new UnauthorizedException('Worker not found');
      }
      return this.issueTokens(worker);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
