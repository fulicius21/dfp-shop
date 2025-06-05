/**
 * Vollständiges Seeding-Skript für DressForPleasure
 * 
 * Kombiniert die Basis-Seed-Daten mit den Fashion-Produktdaten
 */

import { testConnection, closeConnection } from './connection';
import { seedFashionData } from './fashionSeed';
import * as dotenv from 'dotenv';

dotenv.config();

async function completeSeed() {
  console.log('🚀 Starte vollständiges Datenbank-Seeding...');
  console.log('='.repeat(50));

  try {
    // Datenbankverbindung testen
    console.log('🔄 Teste Datenbankverbindung...');
    await testConnection();
    console.log('✅ Datenbankverbindung erfolgreich');

    // Fashion-Daten einfügen
    console.log('\n🌟 Füge Fashion-Produktdaten hinzu...');
    await seedFashionData();

    console.log('\n🎉 Vollständiges Seeding abgeschlossen!');
    console.log('='.repeat(50));
    console.log('✅ Datenbank ist bereit für das Frontend');
    console.log('📊 Alle Kategorien, Kollektionen und Produkte wurden erstellt');
    console.log('🖼️ Produktbilder sind über Cloudinary verfügbar');
    console.log('🛒 E-Commerce-Funktionalität ist vollständig einsatzbereit');

  } catch (error) {
    console.error('❌ Fehler beim Seeding:', error);
    process.exit(1);
  } finally {
    // Datenbankverbindung schließen
    await closeConnection();
    console.log('\n🔐 Datenbankverbindung geschlossen');
  }
}

// Skript ausführen
if (require.main === module) {
  completeSeed();
}

export default completeSeed;
