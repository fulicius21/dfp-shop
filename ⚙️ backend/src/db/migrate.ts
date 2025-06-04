/**
 * Datenbankmigrationen ausführen
 * 
 * Dieses Skript führt alle notwendigen Migrationen aus,
 * um die Datenbank für die DressForPleasure Anwendung vorzubereiten.
 */

import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool, testConnection } from './connection';
import * as dotenv from 'dotenv';

// Environment Variables laden
dotenv.config();

async function runMigrations() {
  console.log('🚀 Starte Datenbankmigrationen...');
  
  try {
    // Verbindung testen
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Datenbankverbindung fehlgeschlagen');
    }

    // Migrationen ausführen
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Alle Migrationen erfolgreich ausgeführt');
  } catch (error) {
    console.error('❌ Migrationsfehler:', error);
    process.exit(1);
  } finally {
    // Verbindung schließen
    await pool.end();
  }
}

// Nur ausführen wenn direkt aufgerufen
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
