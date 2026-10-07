#!/usr/bin/env node

/**
 * Direct MongoDB script to recalculate PF
 * Usage: node fix-pf-direct.js
 */

import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'pem_energy';

/**
 * Calculate Power Factor
 */
function calculatePowerFactor(currentReading, previousReading) {
  if (!previousReading) return null;

  const deltaKWH = currentReading.KWH - previousReading.KWH;
  const deltaLAG = currentReading.KVARHlag - previousReading.KVARHlag;
  const deltaLEAD = currentReading.KVARHlead - previousReading.KVARHlead;

  if (deltaKWH === 0) return null;

  const numerator = Math.abs(deltaKWH);
  const denominator = Math.sqrt(
    Math.pow(deltaKWH, 2) + Math.pow(deltaLAG + deltaLEAD, 2)
  );

  if (denominator === 0) return null;

  const pf = numerator / denominator;
  return Math.round(Math.min(Math.max(pf, 0), 1) * 10000) / 10000;
}

async function fixPF() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    console.log('✓ Connected\n');

    const db = client.db(DB_NAME);
    const collection = db.collection('meterreadings');

    // Get all readings
    const allReadings = await collection
      .find({ deletedAt: null })
      .sort({ readingDate: 1 })
      .toArray();

    console.log(`📊 Found ${allReadings.length} readings\n`);

    // Group by meter
    const byMeter = {};
    for (const reading of allReadings) {
      const meterId = reading.meter.toString();
      if (!byMeter[meterId]) byMeter[meterId] = [];
      byMeter[meterId].push(reading);
    }

    let totalUpdated = 0;

    // Process each meter
    for (const [meterId, readings] of Object.entries(byMeter)) {
      console.log(`⚙️  Processing meter ${meterId}`);
      console.log(`   Readings: ${readings.length}`);

      // Group by month
      const byMonth = {};
      for (const reading of readings) {
        const date = new Date(reading.readingDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[monthKey]) byMonth[monthKey] = [];
        byMonth[monthKey].push(reading);
      }

      const months = Object.keys(byMonth).sort();

      // Process each reading
      for (let i = 0; i < months.length; i++) {
        const currentMonth = months[i];
        const monthReadings = byMonth[currentMonth];

        // Get previous month's last reading
        let previousReading = null;
        if (i > 0) {
          const prevMonth = months[i - 1];
          const prevReadings = byMonth[prevMonth];
          previousReading = prevReadings[prevReadings.length - 1];
        }

        // Update each reading
        for (const reading of monthReadings) {
          let newPF = null;

          if (previousReading) {
            newPF = calculatePowerFactor(reading, previousReading);
          }

          // Update in DB
          if (newPF !== reading.PF) {
            await collection.updateOne(
              { _id: reading._id },
              { $set: { PF: newPF } }
            );

            const dateStr = reading.readingDate.toISOString().split('T')[0];
            console.log(`   ✓ ${dateStr}: PF ${reading.PF} → ${newPF}`);
            totalUpdated++;
          }
        }
      }

      console.log('');
    }

    console.log('='.repeat(60));
    console.log(`✅ COMPLETE - ${totalUpdated} readings updated`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

fixPF();
