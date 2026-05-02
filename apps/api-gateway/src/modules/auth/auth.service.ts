import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { CryptoUtil } from '@/common/utils/crypto.util';

@Injectable()
export class AuthService {
  constructor(private readonly _prisma: PrismaService) {}

  async register(dto: Record<string, any>) {
    const { email, password, name, role } = dto;
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const existingUser = await this._prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    const hashedPassword = CryptoUtil.hashPassword(password);

    const user = await this._prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: role || 'USER',
      },
    });

    const token = CryptoUtil.generateToken({
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async login(dto: Record<string, any>) {
    const { email, password } = dto;
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this._prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = CryptoUtil.verifyPassword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = CryptoUtil.generateToken({
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: token,
    };
  }
}
