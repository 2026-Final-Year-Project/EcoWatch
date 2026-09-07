import { db } from '../config/db.js';
export function getAuthorities(_req, res) {
 res.json(db.prepare('SELECT id,name FROM authorities ORDER BY id').all());
}
