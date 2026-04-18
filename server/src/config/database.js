import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

let pool = null;

export async function initDb(config) {
  pool = mysql.createPool({
    host: config.db.host || 'localhost',
    user: config.db.user || 'root',
    password: config.db.password || '',
    database: config.db.name || 'smartresto',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
  });

  return pool;
}

export function getDb() {
  return pool;
}

export async function query(sql, params = []) {
  if (!pool) throw new Error('Database not initialized');
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function findOne(table, conditions) {
  const keys = Object.keys(conditions);
  const values = Object.values(conditions);
  const where = keys.map(k => `${k} = ?`).join(' AND ');
  const sql = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`;
  const rows = await query(sql, values);
  return rows[0] || null;
}

export async function findAll(table, conditions = {}, options = {}) {
  const keys = Object.keys(conditions);
  const values = Object.values(conditions);
  let sql = `SELECT * FROM ${table}`;
  
  if (keys.length > 0) {
    const where = keys.map(k => `${k} = ?`).join(' AND ');
    sql += ` WHERE ${where}`;
  }
  
  if (options.orderBy) {
    sql += ` ORDER BY ${options.orderBy}`;
  }
  
  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }
  
  return query(sql, values);
}

export async function insert(table, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
  const result = await query(sql, values);
  return result;
}

export async function update(table, id, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const set = keys.map(k => `${k} = ?`).join(', ');
  const sql = `UPDATE ${table} SET ${set} WHERE id = ?`;
  values.push(id);
  return query(sql, values);
}

export async function remove(table, id) {
  return query(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}