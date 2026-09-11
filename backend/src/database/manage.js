import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { db, databasePath } from '../config/db.js';
import { hashPassword } from './password.js';
try {
 const command = process.argv[2];
 if (command === 'init') console.log(`Database ready: ${databasePath}`);
 else if (command === 'check') {
  const integrity = db.prepare('PRAGMA integrity_check').all();
  const foreignKeys = db.prepare('PRAGMA foreign_key_check').all();
  console.log(JSON.stringify({ integrity, foreignKeys }, null, 2));
  if (integrity.some(row => row.integrity_check !== 'ok') || foreignKeys.length) process.exitCode = 1;
 } else if (command === 'backup') {
  if (!process.argv[3]) throw new Error('Usage: npm run db:backup -- /absolute/path/new-backup.sqlite');
  const target = resolve(process.argv[3]);
  db.prepare('VACUUM INTO ?').run(target);
  console.log(`Consistent database backup created: ${target}`);
 } else if (command === 'user') {
  const { ACCOUNT_EMAIL: email, ACCOUNT_NAME: name, ACCOUNT_PASSWORD: password, ACCOUNT_ROLE: role = 'admin' } = process.env;
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || !name || !password || password.length < 8 || !['admin','authority','community'].includes(role)) {
   throw new Error('Set ACCOUNT_EMAIL, ACCOUNT_NAME, ACCOUNT_PASSWORD (8+ characters), and ACCOUNT_ROLE (admin, authority or community).');
  }
  db.prepare('INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,?)').run(randomUUID(),name,email.trim().toLowerCase(),hashPassword(password),role);
  console.log('Account created.');
 } else throw new Error('Unknown database command.');
} finally { db.close(); }
