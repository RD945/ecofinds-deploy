import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET as string;

export function generateToken(payload: object): string {
  return jwt.sign(payload, secret, { expiresIn: '1d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}
