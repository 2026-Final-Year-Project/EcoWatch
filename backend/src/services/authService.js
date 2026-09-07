import crypto from 'node:crypto';
import { db } from '../config/db.js';
import { hashPassword, passwordMatches } from '../database/password.js';
const tokenHash = token => crypto.createHash('sha256').update(token).digest('hex');
function createSession(user) {
 const token = crypto.randomBytes(32).toString('base64url');
 db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
 db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(tokenHash(token), user.id, Date.now() + 8 * 60 * 60 * 1000);
 return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}
export function loginUser(email, password) {
 if (typeof email !== 'string' || typeof password !== 'string' || password.length > 1024) return null;
 const user = db.prepare('SELECT * FROM users WHERE email=? AND disabled=0').get(email.trim().toLowerCase());
 return user && passwordMatches(password, user.password_hash) ? createSession(user) : null;
}
export function registerCommunityUser(name, email, password) {
 if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) throw new Error('Enter a name of up to 80 characters.');
 if (typeof email !== 'string' || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Enter a valid email address.');
 if (typeof password !== 'string' || password.length < 8 || password.length > 1024) throw new Error('Use a password of 8 to 1024 characters.');
 const user = { id: crypto.randomUUID(), name: name.trim(), email: email.trim().toLowerCase(), role: 'community' };
 try {
  db.prepare('INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,?)').run(user.id, user.name, user.email, hashPassword(password), user.role);
 } catch (error) {
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(user.email)) throw new Error('An account already exists for that email address.');
  throw error;
 }
 return createSession(user);
}
export function verifyToken(token) {
 if (typeof token !== 'string' || token.length !== 43) return null;
 return db.prepare('SELECT u.id AS sub,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.disabled=0').get(tokenHash(token), Date.now()) || null;
}
export function revokeToken(token) { db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(token)); }
