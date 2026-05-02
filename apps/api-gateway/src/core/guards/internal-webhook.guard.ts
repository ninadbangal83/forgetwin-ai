import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    const expectedSecret = process.env.INTERNAL_WEBHOOK_SECRET || 'dev_secret_key_123';

    if (token !== expectedSecret) {
      throw new UnauthorizedException('Invalid internal webhook secret');
    }

    return true;
  }
}
