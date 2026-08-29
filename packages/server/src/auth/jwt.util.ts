import * as crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'billetera-comunal-secret-key';

export function signToken(payload: Record<string, any>) {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [header, body, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  if (signature !== expectedSignature)
    throw new Error('Invalid token signature');
  return JSON.parse(Buffer.from(body, 'base64url').toString());
}
