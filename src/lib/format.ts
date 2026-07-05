/** ₹ formatting + the ±30% pay-range helper shared by UI and validation. */

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const PAY_BAND = 0.3;

/** The ±30% range derived from a base pay. Mirrors the DB trigger. */
export function payRange(basePay: number) {
  return {
    min: Math.round(basePay * (1 - PAY_BAND)),
    max: Math.round(basePay * (1 + PAY_BAND)),
  };
}
