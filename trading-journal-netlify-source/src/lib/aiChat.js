
import * as chrono from 'chrono-node';

let conversationHistory = [];
let conversationContext = {};

const TRADING_TERMS = {
  pnl: ['pnl', 'p&l', 'רווח והפסד', 'רווח', 'הפסד', 'ריווח', 'הפסדתי', 'הרווחתי'],
  rr: ['rr', 'r:r', 'risk/reward', 'סיכון/סיכוי', 'יחס סיכון'],
  winrate: ['winrate', 'win rate', 'אחוז הצלחה'],
  smt: ['smt', 'smart money technique'],
  ifvg: ['ifvg', 'inversion fair value gap'],
  'turtle soup': ['turtle soup', 'צבי מרק'],
  amd: ['amd', 'accumulation manipulation distribution'],
  symbol: ['nq', 'es', 'btc', 'eth'],
  analysis: ['analyze', 'analysis', 'flaws', 'weaknesses', 'strengths', 'good at', 'bad at', 'improve', 'performance', 'ניתוח', 'נתח', 'טעויות', 'חולשות', 'חוזקות', 'טוב ב', 'להשתפר', 'ביצועים'],
};

const CASUAL_GREETINGS = ['מה קורה', 'מה נשמע', "what's up", "how's it going", 'מה חדש'];
const HOW_ARE_YOU = ['מה שלומך', 'how are you'];
const WHAT_NOW = ['מה עכשיו', 'what now', 'מה הלאה'];

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const parseNumbers = (text) => {
    const matches = text.replace(/,/g, '').match(/-?\d+(\.\d+)?/g);
    return matches ? matches.map(Number) : [];
};

function extractEntities(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    const entities = {};

    const numbers = parseNumbers(prompt);
    if (numbers.length > 0) {
        if (TRADING_TERMS.pnl.some(term => lowerPrompt.includes(term))) {
            entities.pnl = numbers[0];
            if (lowerPrompt.includes('loss') || lowerPrompt.includes('הפסד') || lowerPrompt.includes('הפסדתי') || entities.pnl < 0) {
                 entities.pnl = -Math.abs(entities.pnl);
            }
        }
        if (TRADING_TERMS.rr.some(term => lowerPrompt.includes(term))) {
            entities.rr = numbers[0];
        }
    }

    const symbolMatch = prompt.match(/\b([A-Z]{2,6}(\d{1,2})?)\b/ig);
    if (symbolMatch) {
        entities.symbol = symbolMatch[0].toUpperCase();
    }

    Object.keys(TRADING_TERMS).forEach(term => {
        if (term === 'analysis') return;
        if (TRADING_TERMS[term].some(alias => lowerPrompt.includes(alias))) {
            if (!entities.strategies) entities.strategies = [];
            if (!entities.strategies.includes(term)) entities.strategies.push(term);
        }
    });
    
    const dateResults = chrono.parse(prompt);
    if (dateResults.length > 0) {
        entities.date = dateResults[0].start.date();
    }

    return entities;
}

function detectIntent(prompt) {
    const p = prompt.toLowerCase();
    if (TRADING_TERMS.analysis.some(t => p.includes(t))) return 'get_analysis';
    if (p.includes('הוסף') || p.includes('add') || p.includes('log') || TRADING_TERMS.pnl.some(t => p.includes(t))) return 'add_trade';
    if (p.includes('עדכן') || p.includes('update') || p.includes('שנה') || p.includes('edit')) return 'update_trade';
    if (p.includes('מחק') || p.includes('delete') || p.includes('remove')) return 'delete_trade';
    if (p.includes('חפש') || p.includes('מצא') || p.includes('search') || p.includes('find') || p.includes('show me') || p.includes('הצג')) return 'search_trades';
    if (p.includes('השווה') || p.includes('compare')) return 'compare_strategies';
    if (p.includes('סיכום') || p.includes('summary') || TRADING_TERMS.winrate.some(t => p.includes(t))) return 'get_summary';
    if (CASUAL_GREETINGS.some(g => p.includes(g))) return 'casual_greeting';
    if (HOW_ARE_YOU.some(g => p.includes(g))) return 'how_are_you';
    if (WHAT_NOW.some(g => p.includes(g))) return 'what_now';
    if (p.includes('היי') || p.includes('שלום') || p.includes('hey') || p.includes('hello')) return 'greeting';
    
    return 'unknown';
}

function handleAddTrade(entities, prompt) {
    conversationContext.lastIntent = 'add_trade';
    let trade = conversationContext.pendingTrade || {};
    
    trade = {...trade, ...entities};
    
    if (!trade.date) trade.date = new Date();
    if (!trade.notes) trade.notes = prompt;
    else if (!trade.notes.includes(prompt)) trade.notes += `\n${prompt}`;

    let missingInfo = [];
    if (!trade.symbol) missingInfo.push("symbol (סימבול)");
    if (trade.pnl === undefined) missingInfo.push("PnL (רווח/הפסד)");
    if (!trade.strategy) {
        const lowerPrompt = prompt.toLowerCase();
        const foundStrategy = Object.keys(TRADING_TERMS).find(term => term !== 'analysis' && TRADING_TERMS[term].some(alias => lowerPrompt.includes(alias)));
        if(foundStrategy) {
            trade.strategy = foundStrategy;
        } else {
            missingInfo.push("strategy (אסטרטגיה)");
        }
    }

    if (missingInfo.length > 0) {
        conversationContext.pendingTrade = trade;
        return {
            content: `קיבלתי. חסר לי רק עוד כמה פרטים כדי להוסיף את העסקה: ${missingInfo.join(', ')}. תוכל לספק אותם?`,
            actions: []
        };
    }
    
    trade.status = trade.pnl >= 0 ? 'win' : 'loss';
    trade.date = trade.date.toISOString();

    conversationContext.pendingTrade = null;
    conversationContext.lastAddedTrade = trade;

    return {
        content: `מעולה, הוספתי עסקה חדשה:
- **סימבול:** ${trade.symbol}
- **סטטוס:** ${trade.status === 'win' ? 'נצחון' : 'הפסד'}
- **רווח/הפסד:** ${formatCurrency(trade.pnl)}
- **אסטרטגיה:** ${trade.strategy}`,
        actions: [{ type: 'add_trade', payload: trade }]
    };
}

function handleSearchTrades(entities, trades) {
    if (!trades || trades.length === 0) {
        return { content: 'אין עסקאות מתועדות כרגע.' };
    }

    let filtered = [...trades];
    if (entities.symbol) {
        filtered = filtered.filter(t => t.symbol.toLowerCase() === entities.symbol.toLowerCase());
    }
    if (entities.strategies) {
        filtered = filtered.filter(t => entities.strategies.some(s => t.strategy?.toLowerCase().includes(s)));
    }
    if(entities.pnl !== undefined) {
       filtered = filtered.filter(t => entities.pnl >= 0 ? t.pnl > 0 : t.pnl < 0);
    }
    if (entities.date) {
        const searchDate = entities.date;
        filtered = filtered.filter(t => new Date(t.date).toDateString() === searchDate.toDateString());
    }
    
    if (filtered.length === 0) {
        return { content: 'לא מצאתי עסקאות שתואמות לחיפוש שלך.' };
    }

    const tradeList = filtered.slice(0, 5).map(t =>
        `- **${t.symbol}** (${new Date(t.date).toLocaleDateString('he-IL')}): ${formatCurrency(t.pnl)}`
    ).join('\n');

    return {
        content: `מצאתי ${filtered.length} עסקאות. הנה ה-${Math.min(5, filtered.length)} האחרונות:\n${tradeList}`
    };
}

function handleGetSummary(trades) {
    if (!trades || trades.length === 0) {
        return { content: 'אין מספיק נתונים לסיכום. נסה להוסיף כמה עסקאות קודם.' };
    }
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const tradesWithRR = trades.filter(t => typeof t.rr === 'number' && t.rr > 0);
    const avgRR = tradesWithRR.length > 0 ? tradesWithRR.reduce((sum, t) => sum + t.rr, 0) / tradesWithRR.length : 0;

    return {
        content: `בטח, הנה סיכום הביצועים שלך:
- **סה"כ עסקאות:** ${totalTrades}
- **אחוז הצלחה:** ${winRate.toFixed(1)}%
- **רווח/הפסד כולל:** ${formatCurrency(totalPnl)}
- **יחס סיכון/סיכוי ממוצע:** ${avgRR > 0 ? `${avgRR.toFixed(2)}R` : 'N/A'}`,
        actions: []
    };
}

function handleAnalysis(trades) {
    if (!trades || trades.length < 5) {
        return { content: 'אני צריך לפחות 5 עסקאות כדי לבצע ניתוח משמעותי. המשך לתעד ואחזור עם תובנות בקרוב!' };
    }

    const strengths = [];
    const weaknesses = [];

    // Strategy analysis
    const strategies = {};
    trades.forEach(t => {
        if (!t.strategy) return;
        if (!strategies[t.strategy]) {
            strategies[t.strategy] = { pnl: 0, wins: 0, losses: 0, count: 0 };
        }
        strategies[t.strategy].pnl += t.pnl;
        strategies[t.strategy].count += 1;
        if (t.pnl > 0) strategies[t.strategy].wins += 1;
        else strategies[t.strategy].losses += 1;
    });

    const sortedStrategies = Object.entries(strategies).sort((a, b) => b[1].pnl - a[1].pnl);
    if (sortedStrategies.length > 0) {
        const bestStrategy = sortedStrategies[0];
        if (bestStrategy[1].pnl > 0) {
            strengths.push(`**האסטרטגיה החזקה ביותר שלך היא '${bestStrategy[0]}',** שהניבה רווח של ${formatCurrency(bestStrategy[1].pnl)}.`);
        }
        const worstStrategy = sortedStrategies[sortedStrategies.length - 1];
        if (worstStrategy[1].pnl < 0) {
            weaknesses.push(`**האסטרטגיה '${worstStrategy[0]}' היא נקודת התורפה שלך,** עם הפסד כולל של ${formatCurrency(worstStrategy[1].pnl)}.`);
        }
    }

    // Win vs Loss analysis
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const avgWin = winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length || 0;
    const avgLoss = losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length || 0;

    if (avgWin > 0) {
        strengths.push(`**הרווח הממוצע שלך בעסקה מנצחת הוא ${formatCurrency(avgWin)},** מה שמראה שאתה נותן לרווחים לגדול.`);
    }
    if (Math.abs(avgLoss) > avgWin && avgLoss !== 0) {
        weaknesses.push(`**ההפסד הממוצע שלך (${formatCurrency(Math.abs(avgLoss))}) גדול מהרווח הממוצע,** מה שמרמז שאתה אולי נותן להפסדים לרוץ יותר מדי.`);
    }

    if (strengths.length === 0) strengths.push("לא זיהיתי חוזקות בולטות כרגע, אבל עם עוד נתונים נוכל למצוא אותן!");
    if (weaknesses.length === 0) weaknesses.push("כל הכבוד! לא זיהיתי חולשות משמעותיות כרגע.");

    return {
        content: `בסדר, ניתחתי את הביצועים שלך. הנה מה שמצאתי:
### 👍 החוזקות שלך
${strengths.map(s => `- ${s}`).join('\n')}

### 🧐 נקודות לשיפור
${weaknesses.map(w => `- ${w}`).join('\n')}

### 🚀 המלצה
המשך להתמקד באסטרטגיות שעובדות עבורך, ושקול להקטין את הסיכון באסטרטגיות המפסידות או ללמוד אותן מחדש.
`
    };
}


function handleDeleteTrade(entities, trades) {
    if (!trades || trades.length === 0) return { content: "אין עסקאות למחוק." };
    
    let tradeToDelete = trades[0]; // Default to last trade
    if (entities.symbol) {
        const found = trades.find(t => t.symbol.toLowerCase() === entities.symbol.toLowerCase());
        if (found) tradeToDelete = found;
    } else if (conversationContext.lastAddedTrade) {
         const found = trades.find(t => t.symbol === conversationContext.lastAddedTrade.symbol && new Date(t.date).getTime() === new Date(conversationContext.lastAddedTrade.date).getTime());
         if (found) tradeToDelete = found;
    }

    return {
        content: `מחקתי את העסקה על **${tradeToDelete.symbol}** מתאריך ${new Date(tradeToDelete.date).toLocaleDateString('he-IL')} עם P&L של **${formatCurrency(tradeToDelete.pnl)}**.`,
        actions: [{ type: 'delete_trade', payload: { id: tradeToDelete.id } }]
    };
}

function handleGreeting() {
    return { content: 'שלום! אני מאמן המסחר האישי שלך. מה נעשה היום - נתעד עסקה, ננתח ביצועים, או משהו אחר?' };
}

function handleCasualGreeting(trades) {
     const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
     const status = totalPnl >= 0 ? "בירוק" : "באדום";
     return { content: `הכל מצוין! אנחנו עומדים על PnL כולל של ${formatCurrency(totalPnl)}, אז אפשר להגיד שהמצב ${status}. מוכן להמשיך לכבוש את השוק?`};
}

function handleHowAreYou() {
    return { content: `אני בסך הכל שורות קוד, אבל אני מרגיש מצוין כשאני עוזר לך להצליח! הכל מוכן ומזומן לנתח את העסקאות שלך. מה על הפרק?` };
}

function handleWhatNow(trades) {
    if (trades.length === 0) {
        return { content: `הצעד הראשון הוא להתחיל לתעד. בוא נוסיף את העסקה הראשונה שלך ונצא לדרך!`};
    }
    const lastTrade = trades[0];
    const timeSinceLastTrade = (new Date() - new Date(lastTrade.date)) / (1000 * 3600 * 24); // days
    
    if(timeSinceLastTrade > 2) {
        return { content: `עבר קצת זמן מאז העסקה האחרונה שתועדה. אולי כדאי שנעדכן את היומן? או שאולי נרצה לבדוק את הביצועים הכלליים?`};
    }
    
    return { content: `אפשר לנתח את הביצועים שלך, להציב מטרות חדשות, או לתעד עסקה נוספת. מה הכיוון שלך?` };
}

function handleUnknown() {
    return {
        content: "לא כל כך הבנתי את זה. אני יכול לעזור לך לתעד עסקאות, לנתח את החוזקות והחולשות שלך, להציג סיכומים ועוד. רק תגיד לי מה אתה צריך."
    };
}

export function getAiChatResponse(prompt, trades) {
    return new Promise(resolve => {
        conversationHistory.push({ role: 'user', content: prompt });
        const entities = extractEntities(prompt);
        let intent = detectIntent(prompt);
        
        if (conversationContext.lastIntent === 'add_trade' && conversationContext.pendingTrade && intent !== 'get_analysis') {
            intent = 'add_trade';
            Object.assign(entities, extractEntities(prompt));
        }
        
        let response;
        switch (intent) {
            case 'add_trade':
                response = handleAddTrade(entities, prompt);
                break;
            case 'search_trades':
                response = handleSearchTrades(entities, trades);
                break;
            case 'get_summary':
                response = handleGetSummary(trades);
                break;
            case 'get_analysis':
                response = handleAnalysis(trades);
                break;
            case 'delete_trade':
                response = handleDeleteTrade(entities, trades);
                break;
            case 'greeting':
                response = handleGreeting();
                break;
            case 'casual_greeting':
                response = handleCasualGreeting(trades);
                break;
            case 'how_are_you':
                response = handleHowAreYou();
                break;
            case 'what_now':
                response = handleWhatNow(trades);
                break;
            default:
                response = handleUnknown();
        }
        
        conversationContext.lastIntent = intent;
        if(intent !== 'add_trade') {
            conversationContext.pendingTrade = null;
        }

        conversationHistory.push({ role: 'assistant', content: response.content });
        setTimeout(() => resolve(response), 500 + Math.random() * 500);
    });
}

export function resetConversation() {
    conversationHistory = [];
    conversationContext = {};
}
