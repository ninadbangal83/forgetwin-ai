import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CryptoUtil } from '@/common/utils/crypto.util';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    console.log(`[JwtAuthGuard] Incoming authorization header: "${authHeader}"`);

    if (!authHeader || !authHeader.match(/^Bearer /i)) {
      console.log(`[JwtAuthGuard] Rejecting because of missing or invalid Bearer match`);
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7).trim();
    console.log(`[JwtAuthGuard] Extracted token string: "${token}"`);
    const payload = CryptoUtil.verifyToken(token);
    console.log(`[JwtAuthGuard] Verification result payload:`, payload);

    if (!payload) {
      console.log(`[JwtAuthGuard] Rejecting because token verification returned null`);
      throw new UnauthorizedException('Invalid or expired access token');
    }

    request.user = payload;
    return true;
  }
}
