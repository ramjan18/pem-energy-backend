import MeterHistory from '../models/MeterHistory.js';

export async function getEffectiveMultiplier(meterId, timestamp, currentMultiplier, savedMultiplier) {
  if (typeof savedMultiplier === 'number' && Number.isFinite(savedMultiplier)) {
    return savedMultiplier;
  }

  const effectiveAt = timestamp || new Date();
  const history = await MeterHistory.find({ meter: meterId })
    .sort({ createdAt: 1 })
    .lean();

  if (!history.length) return currentMultiplier || 1;

  let effectiveMultiplier = history[0].oldMultiplier;
  for (const entry of history) {
    if (new Date(entry.createdAt) > effectiveAt) break;
    effectiveMultiplier = entry.newMultiplier;
  }
  return effectiveMultiplier;
}
