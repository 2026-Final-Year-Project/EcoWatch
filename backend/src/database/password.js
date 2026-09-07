import crypto from 'node:crypto';
export function hashPassword(password) {
 const salt = crypto.randomBytes(16).toString('hex');
 return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
export function passwordMatches(password, stored) {
 if (typeof password !== 'string' || !stored) return false;
 const [salt, hash] = stored.split(':');
 if (!salt || !/^[a-f0-9]{128}$/i.test(hash || '')) return false;
 return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), crypto.scryptSync(password, salt, 64));
}
