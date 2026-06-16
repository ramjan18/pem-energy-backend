#!/usr/bin/env node

/**
 * Standalone script to recalculate PF for all meter readings
 * Run: node recalculate-pf.js
 */

import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import models
import MeterReading from './src/models/MeterReading.js';

/**
 * Calculate Power Factor (PF) based on the difference between two readings
 * Formula: PF = ΔKWh / √(ΔKWh² + (ΔLAG + ΔLEAD)²)
 */
const calculatePowerFactor = (currentReading, previousReading) => {
  try {
    if (!previousReading) {
      return null;
    }

    const deltaKWH = currentReading.KWH - previousReading.KWH;
    const deltaLAG = currentReading.KVARHlag - previousReading.KVARHlag;
    const deltaLEAD = currentReading.KVARHlead - previousReading.KVARHlead;

    if (deltaKWH === 0) {
      return null;
    }

    const numerator = Math.abs(deltaKWH);
    const denominator = Math.sqrt(
      Math.pow(deltaKWH, 2) + Math.pow(deltaLAG + deltaLEAD, 2)
    );

    if (denominator === 0) {
      return null;
    }

    const pf = numerator / denominator;
    const validPF = Math.min(Math.max(pf, 0), 1);

    return Math.round(validPF * 10000) / 10000;
  } catch (error) {
    console.error('Error calculating PF:', error);
    return null;
  }
};

/**
 * Recalculate PF for all readings
 */
async function recalculateAllPF() {
  try {
    console.log('🔄 Starting PF recalculation for all readings...\n');

    // Connect to database
    const mongoUri = 'mongodb://localhost:27017/pem_energy';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Get all unique meters
    const meters = await MeterReading.distinct('meter');
    console.log(`📊 Found ${meters.length} meter(s)\n`);

    let totalUpdated = 0;
    let totalSkipped = 0;
    const updates = [];

    for (const meterId of meters) {
      console.log(`⚙️  Processing meter: ${meterId}`);

      // Get all readings for this meter sorted by date
      const allReadings = await MeterReading.find({
        meter: meterId,
        deletedAt: null,
      }).sort({ readingDate: 1 });

      console.log(`   Total readings: ${allReadings.length}`);

      // Group readings by month (YYYY-MM)
      const readingsByMonth = {};

      for (const reading of allReadings) {
        const date = new Date(reading.readingDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!readingsByMonth[monthKey]) {
          readingsByMonth[monthKey] = [];
        }
        readingsByMonth[monthKey].push(reading);
      }

      // Get sorted months
      const months = Object.keys(readingsByMonth).sort();

      console.log(`   Months with data: ${months.join(', ')}`);

      // Process each reading
      for (let i = 0; i < months.length; i++) {
        const currentMonth = months[i];
        const currentReadings = readingsByMonth[currentMonth];

        // Get last reading of previous month
        let previousMonthReading = null;

        if (i > 0) {
          const previousMonth = months[i - 1];
          const previousReadings = readingsByMonth[previousMonth];
          previousMonthReading = previousReadings[previousReadings.length - 1];
        }

        // Calculate PF for all readings in current month
        for (const currentReading of currentReadings) {
          let newPF = null;

          if (previousMonthReading) {
            const currentData = {
              KWH: currentReading.KWH,
              KVAH: currentReading.KVAH,
              KVARHlag: currentReading.KVARHlag,
              KVARHlead: currentReading.KVARHlead,
            };

            const previousData = {
              KWH: previousMonthReading.KWH,
              KVAH: previousMonthReading.KVAH,
              KVARHlag: previousMonthReading.KVARHlag,
              KVARHlead: previousMonthReading.KVARHlead,
            };

            newPF = calculatePowerFactor(currentData, previousData);
          }

          // Update if PF changed
          const dateStr = currentReading.readingDate.toISOString().split('T')[0];
          
          if (newPF !== currentReading.PF) {
            await MeterReading.findByIdAndUpdate(
              currentReading._id,
              { PF: newPF },
              { new: true }
            );

            const deltaKWH = currentData?.KWH - previousData?.KWH || 0;
            const deltaLAG = currentData?.KVARHlag - previousData?.KVARHlag || 0;
            const deltaLEAD = currentData?.KVARHlead - previousData?.KVARHlead || 0;

            const updateInfo = {
              date: dateStr,
              oldPF: currentReading.PF,
              newPF: newPF,
              deltaKWH: deltaKWH,
              deltaLAG: deltaLAG,
              deltaLEAD: deltaLEAD,
            };

            updates.push(updateInfo);
            console.log(
              `   ✓ ${dateStr}: PF ${currentReading.PF} → ${newPF}`
            );
            totalUpdated++;
          } else {
            totalSkipped++;
          }
        }
      }

      console.log('');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ RECALCULATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`📈 Total readings updated: ${totalUpdated}`);
    console.log(`⏭️  Total readings skipped: ${totalSkipped}`);
    console.log(`📊 Total processed: ${totalUpdated + totalSkipped}\n`);

    // Show sample of updates
    if (updates.length > 0) {
      console.log('📋 Sample of updates (first 10):');
      console.log('-'.repeat(60));
      updates.slice(0, 10).forEach(u => {
        console.log(`${u.date}: ${u.oldPF} → ${u.newPF} (ΔKWh=${u.deltaKWH}, ΔLAG=${u.deltaLAG}, ΔLEAD=${u.deltaLEAD})`);
      });
      if (updates.length > 10) {
        console.log(`... and ${updates.length - 10} more updates`);
      }
    }

    console.log('\n✨ All readings now have correct PF values!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the recalculation
recalculateAllPF();
