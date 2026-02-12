# Daily NSE Analysis Prompt Template

Use this prompt template daily to generate stock picks for MigiTrader users.

---

## Prompt for AI Assistant

```
Analyze the NSE Kenya market for [INSERT DATE: YYYY-MM-DD]:

**1. Pre-Market Summary**
- Review overnight news affecting NSE-listed companies
- Check global market sentiment (US S&P 500, FTSE 100, Brent crude oil prices)
- Note any scheduled earnings releases or dividend announcements today
- Identify any Central Bank of Kenya policy updates affecting interest rates

**2. MigiTrader Stock Picks**

Identify 3 undervalued stocks using these criteria:
- **Dividend Filter**: Dividend yield > 5% OR recent dividend announcement within 30 days
- **Momentum Filter**: Volume spike > 10% vs. 20-day average volume
- **Trend Filter**: Current price above 20-day moving average (uptrend confirmation)
- **Liquidity Filter**: Market cap > KES 5 billion
- **Prioritize**: Blue-chip stocks (Safaricom, EABL, I&M Bank, KCB, Equity)

**3. Ziidi Entry Points**

For each of the 3 picks, calculate:
- **Current Price**: Latest trading price
- **Support Level**: 20-day moving average
- **Entry Point**: Support level + 2% buffer (recommended buy price)
- **Stop-Loss**: Support level - 5% (risk management)
- **Target Price**: Current price + 8-12% (day trade target)
- **Risk/Reward Ratio**: Target upside vs. stop-loss downside

**4. Risk Assessment**
- Market volatility index (if available)
- Currency risk (USD/KES exchange rate trends)
- Sector-specific risks (e.g., regulatory changes, commodity prices)

**Output Format (Structured JSON):**

{
  "date": "YYYY-MM-DD",
  "marketSentiment": "bullish | neutral | bearish",
  "globalContext": "Brief summary of global market conditions",
  "picks": [
    {
      "rank": 1,
      "ticker": "SCOM",
      "name": "Safaricom PLC",
      "currentPrice": 25.50,
      "movingAverage20Day": 24.50,
      "entryPoint": 25.00,
      "stopLoss": 23.75,
      "targetPrice": 27.50,
      "potentialGain": "10.0%",
      "riskRewardRatio": "2.5:1",
      "volumeSpike": "15.2%",
      "dividendYield": "5.8%",
      "reasoning": "Recent dividend announcement (KES 1.40/share) + 15% volume spike. Strong support at 20-day MA. M-Pesa revenue growth expected in Q4 earnings.",
      "catalysts": ["Q4 earnings release", "M-Pesa expansion to Ethiopia"],
      "risks": ["Regulatory pressure on mobile money fees", "USD/KES volatility"]
    },
    {
      "rank": 2,
      "ticker": "EABL",
      "name": "East African Breweries Ltd",
      "currentPrice": 185.00,
      "movingAverage20Day": 180.00,
      "entryPoint": 183.60,
      "stopLoss": 171.00,
      "targetPrice": 203.50,
      "potentialGain": "10.0%",
      "riskRewardRatio": "2.8:1",
      "volumeSpike": "12.8%",
      "dividendYield": "6.2%",
      "reasoning": "Strong dividend history (6.2% yield). Volume spike indicates institutional accumulation. Consumer staples resilience during inflation.",
      "catalysts": ["Upcoming dividend ex-date", "East Africa expansion"],
      "risks": ["Excise duty increases", "Competition from local brewers"]
    },
    {
      "rank": 3,
      "ticker": "IMHC",
      "name": "I&M Holdings",
      "currentPrice": 42.50,
      "movingAverage20Day": 41.00,
      "entryPoint": 41.80,
      "stopLoss": 38.95,
      "targetPrice": 46.75,
      "potentialGain": "10.0%",
      "riskRewardRatio": "2.4:1",
      "volumeSpike": "11.5%",
      "dividendYield": "7.1%",
      "reasoning": "Highest dividend yield among banking stocks. Recent acquisition synergies improving ROE. Strong Q3 results beat expectations.",
      "catalysts": ["CBK interest rate decision", "Digital banking growth"],
      "risks": ["NPL ratio concerns", "Regulatory capital requirements"]
    }
  ],
  "disclaimer": "This analysis is for informational purposes only and does not constitute financial advice. Always conduct your own research and consult a licensed financial advisor before making investment decisions."
}
```

---

## Usage Instructions

1. **Daily Execution**: Run this prompt every trading day before NSE market opens (9:00 AM EAT)
2. **Data Sources**: Use real-time NSE data from authorized vendors (Synergy Systems, ICE, or NSE official API)
3. **Validation**: Cross-check AI output with actual market data before displaying to users
4. **Human Review**: Financial analyst should review picks before publication
5. **Compliance**: Ensure all recommendations comply with CMA (Capital Markets Authority) Kenya regulations

---

## Custom Variables to Update Daily

- `[INSERT DATE]`: Current date in YYYY-MM-DD format
- **Blue-chip focus**: Adjust based on recent dividend announcements
- **Volume threshold**: May adjust to 8-12% during low-volatility periods
- **Target returns**: Can adjust to 6-10% for conservative strategies

---

## Example Output (Sample)

```json
{
  "date": "2026-02-12",
  "marketSentiment": "bullish",
  "globalContext": "US markets closed higher (S&P +0.8%). Oil stable at $76/barrel. USD/KES at 129.5, slightly weaker shilling supports exporters.",
  "picks": [
    {
      "rank": 1,
      "ticker": "SCOM",
      "name": "Safaricom PLC",
      "currentPrice": 25.50,
      "entryPoint": 25.00,
      "stopLoss": 23.75,
      "targetPrice": 27.50,
      "reasoning": "Recent dividend announcement + 15% volume spike",
      ...
    }
  ]
}
```
