import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';
import { signToken } from './jwt.util';

@Injectable()
export class AuthService {
  async register(name: string, email: string, password: string) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existing.length > 0)
      throw new ConflictException('Email already in use');

    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning();

    const token = signToken({ userId: user.id, email: user.email });
    return { user: { id: user.id, name: user.name, email: user.email }, token };
  }

  async login(email: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    if (user.passwordHash !== passwordHash)
      throw new UnauthorizedException('Invalid credentials');

    const token = signToken({ userId: user.id, email: user.email });
    return { user: { id: user.id, name: user.name, email: user.email }, token };
  }
}
