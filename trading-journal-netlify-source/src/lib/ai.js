export async function getTradingInsights(trades) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!trades || trades.length === 0) {
        resolve({
          strengths: [],
          weaknesses: [],
          suggestions: ["Start by adding some trades to your journal to get AI insights."],
        });
        return;
      }

      const mockResponse = {
        strengths: [
          "Your 'long' positions are consistently profitable, showing a good eye for upward trends.",
          "The 'Earnings Play' strategy is a clear winner, yielding significant gains.",
          "You are effective at identifying and executing 'Breakout' setups."
        ],
        weaknesses: [
          "Short selling appears to be a major weakness, contributing to most of your losses.",
          "Trades with the 'scalp' tag have a low win rate and negatively impact overall P&L.",
          "There's a tendency to let losing trades run, as seen in some large negative P&L values."
        ],
        suggestions: [
          "Double down on your 'long' trade strategies. Increase allocation to what's working.",
          "Pause or significantly reduce position size on 'short' trades. Study reversal patterns before re-engaging.",
          "Implement a stricter stop-loss rule to cut losing trades faster and protect your capital."
        ]
      };
      resolve(mockResponse);
    }, 1500);
  });
}