import { NextResponse } from 'next/server';

// 1. TYPESCRIPT INTERFACES
export interface AssetSignal {
  assetName: string;
  ticker: string;
  assetType: 'EQUITY' | 'IFB';
  currentValue: string;
  metricDetails: string;
  portalUrl: string;
  triggerAlert: boolean;
}

// 2. UTILITIES: MarkdownV2 Safe Escaper for Telegram Parser
function escapeMarkdown(text: string): string {
  // Telegram MarkdownV2 requires escaping: \, _, *, [, ], (, ), ~, `, >, #, +, -, =, |, {, }, ., !
  // We must escape backslash \ first to prevent double-escaping, then all other special characters.
  return text.replace(/[\_\[\]()~`>#+\-=|{}.!]/g, '\\$&')
             .replace(/\*/g, '\\*'); // Explicitly escape asterisks separately for parsing stability
}

// 3. TELEGRAM BOT INTEGRATION
async function sendTelegramAlert(signal: AssetSignal): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('⚠️ Telegram bot credentials missing in process.env (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID). Skipping dispatch.');
    return false;
  }

  // Prepend emoji depending on asset class
  const emoji = signal.assetType === 'IFB' ? '💎' : '📈';
  
  // Format message text strictly using MarkdownV2 syntax guidelines
  const header = `*${emoji} NEW SIGNAL: ${escapeMarkdown(signal.assetName)}* \\(\`${escapeMarkdown(signal.ticker)}\`\\)`;
  const assetClass = `*Asset Class:* _${escapeMarkdown(signal.assetType)}_`;
  const value = `*Current Value:* \`${escapeMarkdown(signal.currentValue)}\``;
  const metrics = `*Metrics:* _${escapeMarkdown(signal.metricDetails)}_`;
  const time = `*Dispatch Time:* ${escapeMarkdown(new Date().toISOString())}`;

  const messageText = `${header}\n\n${assetClass}\n${value}\n${metrics}\n\n${time}`;

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text: messageText,
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚀 Open Platform to Trade',
            url: signal.portalUrl
          }
        ]
      ]
    }
  };

  try {
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`❌ Telegram sendMessage endpoint returned status ${response.status}: ${errBody}`);
      return false;
    }

    console.log(`✅ Telegram alert successfully dispatched for ${signal.ticker}`);
    return true;
  } catch (error) {
    console.error(`❌ Exception occurred sending Telegram alert for ${signal.ticker}:`, error);
    return false;
  }
}

// 4. HTTP GET HANDLER
export async function GET(): Promise<NextResponse> {
  try {
    // Array of simulated asset objects containing real-world mock data
    const mockSignals: AssetSignal[] = [
      {
        assetName: 'Safaricom PLC',
        ticker: 'SCOM',
        assetType: 'EQUITY',
        currentValue: 'KES 25.50',
        metricDetails: 'Price broke above 20-day Moving Average on 15% volume spike. 14-day RSI is 32 (Oversold).',
        portalUrl: 'https://aibaxys.kenyaonline.co.ke',
        triggerAlert: true
      },
      {
        assetName: 'CBK Infrastructure Bond',
        ticker: 'IFB1/2026/10Yr',
        assetType: 'IFB',
        currentValue: '18.25% Yield',
        metricDetails: 'New infrastructure bond issuance. High coupon rate yields attractive risk-adjusted income.',
        portalUrl: 'https://dhowcsd.centralbank.go.ke',
        triggerAlert: true
      },
      {
        assetName: 'KCB Group PLC',
        ticker: 'KCB',
        assetType: 'EQUITY',
        currentValue: 'KES 38.75',
        metricDetails: 'Trading within a flat neutral consolidation range. No active breakouts detected.',
        portalUrl: 'https://aibaxys.kenyaonline.co.ke',
        triggerAlert: false // Alerts suppressed for this asset
      }
    ];

    const dispatchedTickers: string[] = [];

    // Iterate and fire alerts strictly if triggerAlert is true
    for (const signal of mockSignals) {
      if (signal.triggerAlert) {
        const success = await sendTelegramAlert(signal);
        if (success) {
          dispatchedTickers.push(signal.ticker);
        }
      }
    }

    // Success response
    return NextResponse.json({
      success: true,
      dispatchedTickers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Critical failure in GET signals pipeline:', error);
    
    // Return structured 500 error boundary message
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process signal queue and dispatch bot intelligence indicators',
        details: error instanceof Error ? error.message : 'Unknown internal system error'
      },
      { status: 500 }
    );
  }
}
