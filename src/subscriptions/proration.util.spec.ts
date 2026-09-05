import { calculateProration } from './proration.util';

describe('calculateProration', () => {
  it('should calculate an upgrade charge correctly', () => {
    const result = calculateProration(499, 999, 0.5);

    expect(result.oldPlanRemainingPaise).toBe(24950);

    expect(result.newPlanRemainingPaise).toBe(49950);

    expect(result.proratedAmountPaise).toBe(25000);

    expect(result.proratedAmount).toBe(250);
  });

  it('should not create a charge for a downgrade', () => {
    const result = calculateProration(999, 499, 0.5);

    expect(result.proratedAmountPaise).toBe(0);
  });
});
