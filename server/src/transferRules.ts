export interface TransferAccounting {
  transfersThisWeek: number;
  freeTransfers: number;
  pointsHit: number;
}

/**
 * Applies transfers sequentially: free transfers are consumed first, then
 * every additional transfer adds exactly four points to the current hit.
 * Wildcard and Free Hit bypass transfer charges for that gameweek.
 */
export function calculateTransferAccounting(
  incomingCount: number,
  freeTransfers: number,
  pointsHit: number,
  transfersThisWeek: number,
  unlimited: boolean
): TransferAccounting {
  if (!Number.isInteger(incomingCount) || incomingCount < 0) {
    throw new Error("incomingCount must be a non-negative integer");
  }

  let free = Math.max(0, freeTransfers);
  let hit = Math.max(0, pointsHit);
  for (let i = 0; i < incomingCount; i += 1) {
    if (!unlimited && free > 0) free -= 1;
    else if (!unlimited) hit += 4;
  }

  return {
    transfersThisWeek: transfersThisWeek + incomingCount,
    freeTransfers: unlimited ? freeTransfers : free,
    pointsHit: unlimited ? pointsHit : hit,
  };
}
