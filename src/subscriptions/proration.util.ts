export function calculateProration(
  oldPrice: number,
  newPrice: number,
  remainingRatio: number,
) {
  const oldPlanRemaining = Math.round(oldPrice * remainingRatio * 100);

  const newPlanRemaining = Math.round(newPrice * remainingRatio * 100);

  const proratedAmountPaise = Math.max(newPlanRemaining - oldPlanRemaining, 0);

  return {
    oldPlanRemainingPaise: oldPlanRemaining,
    newPlanRemainingPaise: newPlanRemaining,
    proratedAmountPaise,
    proratedAmount: proratedAmountPaise / 100,
  };
}
