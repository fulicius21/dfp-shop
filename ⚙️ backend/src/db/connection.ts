/**
 * Datenbankverbindung für DressForPleasure Backend
 * 
 * Diese Datei konfiguriert die PostgreSQL-Verbindung mit Drizzle ORM.
 * Unterstützt sowohl lokale Entwicklung als auch Cloud-Deployment.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Environment Variables laden
const DATABASE_URL = process.env.DATABASE_URL;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432');
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Pool-Konfiguration für verschiedene Umgebungen
const getPoolConfig = () => {
  // Wenn DATABASE_URL vorhanden ist (Cloud-Deployment), diese verwenden
  if (DATABASE_URL) {
    return {
      connectionString: DATABASE_URL,
      ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximale Anzahl Verbindungen im Pool
      idleTimeoutMillis: 30000, // 30 Sekunden
      connectionTimeoutMillis: 2000, // 2 Sekunden
    };
  }

  // Lokale Entwicklung - einzelne Parameter
  return {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    max: NODE_ENV === 'development' ? 10 : 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
};

// PostgreSQL Pool erstellen
const pool = new Pool(getPoolConfig());

// Drizzle ORM Instance erstellen
export const db = drizzle(pool, { 
  schema,
  logger: NODE_ENV === 'development' ? true : false
});

// Pool Events für Monitoring
pool.on('connect', (client) => {
  console.log('✅ Neue Datenbankverbindung hergestellt');
});

pool.on('error', (err, client) => {
  console.error('❌ Unerwarteter Datenbankfehler:', err);
  process.exit(-1);
});

// Verbindungstest-Funktion
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Datenbankverbindung erfolgreich getestet:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Datenbankverbindungstest fehlgeschlagen:', error);
    return false;
  }
};

// Graceful Shutdown
export const closeConnection = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('✅ Datenbankverbindung geschlossen');
  } catch (error) {
    console.error('❌ Fehler beim Schließen der Datenbankverbindung:', error);
  }
};

// Health Check für die Datenbank
export const healthCheck = async (): Promise<{ status: string; message: string; timestamp: Date }> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as health');
    client.release();
    
    return {
      status: 'healthy',
      message: 'Datenbankverbindung ist aktiv',
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Datenbankverbindung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      timestamp: new Date()
    };
  }
};

// Export der Pool-Instance für erweiterte Operationen
export { pool };

// Export der Schema-Typen für TypeScript
export type Database = typeof db;
export * from './schema';
