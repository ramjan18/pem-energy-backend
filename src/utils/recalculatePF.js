/**
 * Script to recalculate PF for all existing meter readings
 * Uses the corrected logic: compares against last reading of previous month
 */

import mongoose from 'mongoose';
import MeterReading from '../models/MeterReading.js';
import { calculatePowerFactor } from './pfCalculation.js';

export const recalculateAllPF = async () => {
  try {
    console.log('Starting PF recalculation for all readings...\n');

    // Get all unique meters
    const meters = await MeterReading.distinct('meter');
    console.log(`Found ${meters.length} meters\n`);

    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const meterId of meters) {
      console.log(`Processing meter: ${meterId}`);

      // Get all readings for this meter sorted by date
      const allReadings = await MeterReading.find({
        meter: meterId,
        deletedAt: null,
      }).sort({ readingDate: 1 });

      console.log(`  Total readings: ${allReadings.length}`);

      // Group readings by month
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

      // Process each reading
      for (let i = 0; i < months.length; i++) {
        const currentMonth = months[i];
        const currentReadings = readingsByMonth[currentMonth];

        // Get last reading of previous month (if exists)
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
          if (newPF !== currentReading.PF) {
            await MeterReading.findByIdAndUpdate(
              currentReading._id,
              { PF: newPF },
              { new: true }
            );

            console.log(
              `    ${currentReading.readingDate.toISOString().split('T')[0]} - PF updated: ${currentReading.PF} → ${newPF}`
            );
            totalUpdated++;
          } else {
            totalSkipped++;
          }
        }
      }

      console.log('');
    }

    console.log(`\n=== RECALCULATION COMPLETE ===`);
    console.log(`Total readings updated: ${totalUpdated}`);
    console.log(`Total readings skipped (no change): ${totalSkipped}`);

    return {
      success: true,
      updated: totalUpdated,
      skipped: totalSkipped,
    };
  } catch (error) {
    console.error('Error recalculating PF:', error);
    throw error;
  }
};

// Run if called directly
if (process.argv[1].includes('recalculatePF.js')) {
  const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pem_energy';

  mongoose
    .connect(dbURI)
    .then(async () => {
      console.log('Connected to MongoDB\n');
      const result = await recalculateAllPF();
      console.log('\nResult:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database connection error:', error);
      process.exit(1);
    });
}

export default recalculateAllPF;
