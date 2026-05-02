import { createHmac, pbkdf2Sync, timingSafeEqual } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_456_change_me';

export class CryptoUtil {
  static hashPassword(password: string): string {
    const salt = 'forgetwin_auth_salt';
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash;
  }

  static verifyPassword(password: string, hash: string): boolean {
    const computedHash = this.hashPassword(password);
    return timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'));
  }

  static generateToken(payload: Record<string, any>): string {
    const data = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }), 'utf8').toString('base64');
    const signature = createHmac('sha256', JWT_SECRET).update(data).digest('hex');
    return `${data}.${signature}`;
  }

  static verifyToken(token: string): any {
    try {
      if (!token || typeof token !== 'string') return null;
      const parts = token.trim().split('.');
      if (parts.length !== 2) return null;
      const [data, signature] = parts;
      const expectedSignature = createHmac('sha256', JWT_SECRET).update(data).digest('hex');
      if (signature !== expectedSignature) return null;
      return JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
    } catch {
      return null;
    }
  }
}
