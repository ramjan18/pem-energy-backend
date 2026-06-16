/**
 * Power Factor Calculation Utilities
 * Formula: PF = ΔKWh / √(ΔKWh² + (ΔLAG + ΔLEAD)²)
 */

/**
 * Calculate Power Factor based on differences between two readings
 * @param {Object} currentReading - Current meter reading {KWH, KVAH, KVARHlag, KVARHlead}
 * @param {Object} previousReading - Previous meter reading {KWH, KVAH, KVARHlag, KVARHlead}
 * @returns {number|null} - Power Factor (0-1) or null if cannot calculate
 */
export const calculatePowerFactor = (currentReading, previousReading) => {
  try {
    // Calculate differences
    const deltaKWH = currentReading.KWH - previousReading.KWH;
    const deltaLag = currentReading.KVARHlag - previousReading.KVARHlag;
    const deltaLead = currentReading.KVARHlead - previousReading.KVARHlead;
    const deltaLagPlusLead = deltaLag + deltaLead;

    // If no consumption, PF is not applicable
    if (deltaKWH <= 0) {
      return null;
    }

    // Calculate using formula: PF = ΔKWh / √(ΔKWh² + (ΔLAG + ΔLEAD)²)
    const kwhSquared = Math.pow(deltaKWH, 2);
    const varSquared = Math.pow(deltaLagPlusLead, 2);
    const denominator = Math.sqrt(kwhSquared + varSquared);

    if (denominator === 0) {
      return null;
    }

    const pf = deltaKWH / denominator;

    // Ensure PF is within valid range (0-1)
    const validPF = Math.max(0, Math.min(1, pf));

    // Round to 4 decimal places
    return Math.round(validPF * 10000) / 10000;
  } catch (error) {
    console.error('Error calculating power factor:', error);
    return null;
  }
};

/**
 * Calculate comprehensive PF metrics
 * @param {Object} currentReading - Current meter reading
 * @param {Object} previousReading - Previous meter reading
 * @returns {Object} - Metrics object with PF and calculation details
 */
export const calculatePFMetrics = (currentReading, previousReading) => {
  const deltaKWH = currentReading.KWH - previousReading.KWH;
  const deltaLag = currentReading.KVARHlag - previousReading.KVARHlag;
  const deltaLead = currentReading.KVARHlead - previousReading.KVARHlead;
  const deltaLagPlusLead = deltaLag + deltaLead;

  const kwhSquared = Math.pow(deltaKWH, 2);
  const varSquared = Math.pow(deltaLagPlusLead, 2);
  const denominator = Math.sqrt(kwhSquared + varSquared);

  const pf = deltaKWH > 0 && denominator > 0 ? Math.round((deltaKWH / denominator) * 10000) / 10000 : null;

  return {
    pf: pf ? Math.max(0, Math.min(1, pf)) : null,
    deltaKWH,
    deltaLag,
    deltaLead,
    deltaLagPlusLead,
    calculation: {
      deltaKWHSquared: kwhSquared,
      deltaVARSquared: varSquared,
      denominator: Math.round(denominator * 10000) / 10000,
      formula: 'PF = ΔKWh / √(ΔKWh² + (ΔLAG + ΔLEAD)²)',
    },
  };
};
