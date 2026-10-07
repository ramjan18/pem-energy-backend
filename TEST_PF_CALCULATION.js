/**
 * Test file for Power Factor Calculation
 * Uses the exact example data provided by the user
 */

import { calculatePowerFactor, calculatePFMetrics } from './src/utils/pfCalculation.js';

// Test data from user requirement
const previousReading = {
  KWH: 360926,
  KVAH: 362303,
  KVARHlag: 28940,  // LAG
  KVARHlead: 187,   // LEAD
};

const currentReading = {
  KWH: 369354,
  KVAH: 370773,
  KVARHlag: 29739,  // LAG
  KVARHlead: 187,   // LEAD
};

console.log('=== POWER FACTOR CALCULATION TEST ===\n');

console.log('Previous Reading (31-05-2026):');
console.log(`  KWH: ${previousReading.KWH}`);
console.log(`  KVAH: ${previousReading.KVAH}`);
console.log(`  KVARHlag: ${previousReading.KVARHlag}`);
console.log(`  KVARHlead: ${previousReading.KVARHlead}\n`);

console.log('Current Reading (05-06-2026):');
console.log(`  KWH: ${currentReading.KWH}`);
console.log(`  KVAH: ${currentReading.KVAH}`);
console.log(`  KVARHlag: ${currentReading.KVARHlag}`);
console.log(`  KVARHlead: ${currentReading.KVARHlead}\n`);

// Calculate differences manually for verification
const deltaKWH = currentReading.KWH - previousReading.KWH;
const deltaLAG = currentReading.KVARHlag - previousReading.KVARHlag;
const deltaLEAD = currentReading.KVARHlead - previousReading.KVARHlead;

console.log('Differences:');
console.log(`  ΔKWh = ${currentReading.KWH} - ${previousReading.KWH} = ${deltaKWH}`);
console.log(`  ΔLag = ${currentReading.KVARHlag} - ${previousReading.KVARHlag} = ${deltaLAG}`);
console.log(`  ΔLead = ${currentReading.KVARHlead} - ${previousReading.KVARHlead} = ${deltaLEAD}\n`);

// Manual calculation for verification
const deltaLagPlusLead = deltaLAG + deltaLEAD;
const kwhSquared = Math.pow(deltaKWH, 2);
const varSquared = Math.pow(deltaLagPlusLead, 2);
const sumOfSquares = kwhSquared + varSquared;
const denominator = Math.sqrt(sumOfSquares);
const manualPF = deltaKWH / denominator;

console.log('Manual Calculation Verification:');
console.log(`  ΔKWh² = ${deltaKWH}² = ${kwhSquared}`);
console.log(`  (ΔLag + ΔLead)² = (${deltaLAG} + ${deltaLEAD})² = (${deltaLagPlusLead})² = ${varSquared}`);
console.log(`  Sum = ${kwhSquared} + ${varSquared} = ${sumOfSquares}`);
console.log(`  √Sum = √${sumOfSquares} = ${denominator}`);
console.log(`  PF = ${deltaKWH} / ${denominator} = ${manualPF}`);
console.log(`  PF (rounded) = ${Math.round(manualPF * 10000) / 10000}\n`);

// Test the utility functions
console.log('=== TESTING UTILITY FUNCTIONS ===\n');

const pf = calculatePowerFactor(currentReading, previousReading);
console.log(`calculatePowerFactor() result: ${pf}`);
console.log(`Expected: 0.9955`);
console.log(`Match: ${pf === 0.9955 ? '✓ YES' : '✗ NO'}\n`);

const metrics = calculatePFMetrics(currentReading, previousReading);
console.log('calculatePFMetrics() result:');
console.log(JSON.stringify(metrics, null, 2));

console.log('\n=== TEST COMPLETE ===');
console.log(`If all values match expectations, the PF calculation is working correctly.`);
