import Meter from '../models/Meter.js';
import User from '../models/User.js';
import MeterReading from '../models/MeterReading.js';

/**
 * Run database diagnostics to identify data integrity issues
 */
export const runDBDiagnostics = async () => {
  console.log('\n📋 Starting Database Diagnostics...\n');

  try {
    // Check 1: Count documents
    const meterCount = await Meter.countDocuments();
    const userCount = await User.countDocuments();
    const readingCount = await MeterReading.countDocuments();

    console.log('✓ Document Counts:');
    console.log(`  - Meters: ${meterCount}`);
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Readings: ${readingCount}\n`);

    // Check 2: Find readings with invalid meter references
    console.log('⚠️ Checking for orphaned readings (invalid meter references)...');
    const readingsWithoutMeters = await MeterReading.find()
      .populate('meter', null, null, { strictPopulate: false })
      .exec();

    const orphanedReadings = readingsWithoutMeters.filter(r => !r.meter);
    if (orphanedReadings.length > 0) {
      console.log(`  ⚠️ Found ${orphanedReadings.length} readings with invalid meter references`);
      console.log('  IDs:', orphanedReadings.map(r => r._id));
    } else {
      console.log('  ✓ No orphaned readings found');
    }
    console.log();

    // Check 3: Find readings with invalid user references
    console.log('⚠️ Checking for invalid user references...');
    const readingsWithoutUsers = await MeterReading.find()
      .populate('recordedBy', null, null, { strictPopulate: false })
      .exec();

    const invalidUserReadings = readingsWithoutUsers.filter(r => !r.recordedBy);
    if (invalidUserReadings.length > 0) {
      console.log(`  ⚠️ Found ${invalidUserReadings.length} readings with invalid user references`);
      console.log('  IDs:', invalidUserReadings.map(r => r._id));
    } else {
      console.log('  ✓ No invalid user references found');
    }
    console.log();

    // Check 4: Verify data types
    console.log('✓ Checking data types in recent readings...');
    const recentReadings = await MeterReading.find()
      .limit(5)
      .populate('meter recordedBy');

    recentReadings.forEach((reading, idx) => {
      console.log(`  Reading ${idx + 1}:`);
      console.log(`    - Meter: ${reading.meter?.meterName || 'MISSING'}`);
      console.log(`    - Shift: ${reading.shift} (type: ${typeof reading.shift})`);
      console.log(`    - KWH: ${reading.KWH} (type: ${typeof reading.KWH})`);
      console.log(`    - Date: ${reading.readingDate}`);
    });
    console.log();

    // Check 5: Verify all meters exist
    console.log('✓ Listing all meters:');
    const allMeters = await Meter.find();
    allMeters.forEach((meter, idx) => {
      console.log(`  ${idx + 1}. ${meter.meterName} (ID: ${meter._id}, Num: ${meter.meterNumber})`);
    });
    console.log();

    console.log('✅ Database diagnostics complete!\n');
    return {
      meterCount,
      userCount,
      readingCount,
      orphanedReadingsCount: orphanedReadings.length,
      invalidUserReferencesCount: invalidUserReadings.length,
    };
  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
    throw error;
  }
};
