import { NextResponse } from 'next/server';
import { calculateCompoundInterest } from '@/utils/mmfMath';

export const dynamic = 'force-dynamic';

// Simulated DB state for the Etica Money Market Fund account
const ETICA_MMF_ACCOUNT = {
  accountName: 'Etica Money Market Fund',
  initialPrincipal: 100000, // KES 100,000
  annualYield: 13.5,        // 13.5% yield
  startDate: '2026-05-01',  // Fund active date
};

export async function GET(): Promise<NextResponse> {
  try {
    const calculations = calculateCompoundInterest({
      initialPrincipal: ETICA_MMF_ACCOUNT.initialPrincipal,
      annualYield: ETICA_MMF_ACCOUNT.annualYield,
      startDate: ETICA_MMF_ACCOUNT.startDate,
    });

    return NextResponse.json({
      success: true,
      accountName: ETICA_MMF_ACCOUNT.accountName,
      initialPrincipal: ETICA_MMF_ACCOUNT.initialPrincipal,
      annualYield: ETICA_MMF_ACCOUNT.annualYield,
      startDate: ETICA_MMF_ACCOUNT.startDate,
      ...calculations,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown MMF calculation error';
    console.error('❌ MMF Calculation Error:', message);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process MMF interest simulation',
        details: message,
      },
      { status: 500 }
    );
  }
}
