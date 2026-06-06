/**
 * Compounding Money Market Fund Math Engine
 */

interface CompoundInterestInput {
  initialPrincipal: number;
  annualYield: number;
  startDate: string | Date;
}

interface CompoundInterestResult {
  daysElapsed: number;
  currentBalance: number;
  totalInterestEarned: number;
  dailyRate: number;
}

/**
 * Calculates the daily compounding balance of a money market fund.
 *
 * Formula:
 *   dailyRate = (annualYield / 100) / 365
 *   currentBalance = initialPrincipal * Math.pow(1 + dailyRate, daysElapsed)
 *
 * @param input CompoundInterestInput parameters
 * @returns CompoundInterestResult calculated values
 */
export function calculateCompoundInterest(
  input: CompoundInterestInput
): CompoundInterestResult {
  const { initialPrincipal, annualYield, startDate } = input;

  // Normalize dates to midnight to compute absolute calendar days elapsed
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = Math.max(0, today.getTime() - start.getTime());
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Annual yield to daily rate decimal
  const dailyRate = annualYield / 100 / 365;

  // Apply daily compounding formula
  const currentBalance = initialPrincipal * Math.pow(1 + dailyRate, daysElapsed);
  const totalInterestEarned = currentBalance - initialPrincipal;

  return {
    daysElapsed,
    currentBalance: parseFloat(currentBalance.toFixed(2)),
    totalInterestEarned: parseFloat(totalInterestEarned.toFixed(2)),
    dailyRate,
  };
}
