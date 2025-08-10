import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Edit, Trash2, CalendarDays, BarChartHorizontal } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { startOfWeek, startOfMonth, isWithinInterval, parseISO } from 'date-fns';

export function Dashboard({ trades, onEdit, onDelete }) {
  const { toast } = useToast();

  const calculateStats = () => {
    if (!trades || trades.length === 0) {
      return {
        totalPnL: 0, winRate: 0, totalTrades: 0, winningTrades: 0, losingTrades: 0, avgWin: 0, avgLoss: 0, bestTrade: 0, worstTrade: 0, avgRR: 0, weeklyPnL: 0, monthlyPnL: 0
      };
    }

    const now = new Date();
    const startOfThisWeek = startOfWeek(now);
    const startOfThisMonth = startOfMonth(now);

    const weeklyTrades = trades.filter(t => t.status !== 'withdrawal' && isWithinInterval(parseISO(t.date), { start: startOfThisWeek, end: now }));
    const monthlyTrades = trades.filter(t => t.status !== 'withdrawal' && isWithinInterval(parseISO(t.date), { start: startOfThisMonth, end: now }));
    const allTradingTrades = trades.filter(t => t.status !== 'withdrawal');
    
    const weeklyPnL = weeklyTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const monthlyPnL = monthlyTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    const totalPnL = allTradingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = allTradingTrades.filter(trade => trade.pnl > 0);
    const losingTrades = allTradingTrades.filter(trade => trade.pnl < 0);
    const winRate = allTradingTrades.length > 0 ? winningTrades.length / allTradingTrades.length * 100 : 0;
    const totalWinPnl = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const totalLossPnl = losingTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const avgWin = winningTrades.length > 0 ? totalWinPnl / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(totalLossPnl / losingTrades.length) : 0;
    const bestTrade = Math.max(0, ...allTradingTrades.map(trade => trade.pnl || 0));
    const worstTrade = Math.min(0, ...allTradingTrades.map(trade => trade.pnl || 0));
    
    const tradesWithRR = allTradingTrades.filter(trade => typeof trade.rr === 'number' && trade.rr > 0);
    const totalRR = tradesWithRR.reduce((sum, trade) => sum + trade.rr, 0);
    const avgRR = tradesWithRR.length > 0 ? totalRR / tradesWithRR.length : 0;

    return {
      totalPnL, winRate, totalTrades: allTradingTrades.length, winningTrades: winningTrades.length, losingTrades: losingTrades.length, avgWin, avgLoss, bestTrade, worstTrade, avgRR, weeklyPnL, monthlyPnL
    };
  };

  const stats = calculateStats();
  
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const formatPercentage = value => {
    return `${value.toFixed(1)}%`;
  };

  const handleDelete = trade => {
    onDelete(trade.id);
    toast({
      title: "Trade Deleted",
      description: `Removed ${trade.symbol} trade from journal`
    });
  };
  
  const StatCard = ({ title, value, icon: Icon, trend, className = "", children }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        whileHover={{ translateY: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.05)" }}
    >
      <Card className={`bg-card border border-muted/20 hover:border-primary/20 transition-all duration-300 shadow-xl ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {Icon && <Icon className={`h-5 w-5 ${trend === 'up' ? 'text-green-600' : 'text-primary'}`} />}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">{value}</div>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );

  return <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-left">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">Your comprehensive trading performance overview.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Weekly P&L" value={formatCurrency(stats.weeklyPnL)} icon={CalendarDays} trend={stats.weeklyPnL >= 0 ? 'up' : 'down'} />
        <StatCard title="Monthly P&L" value={formatCurrency(stats.monthlyPnL)} icon={Calendar} trend={stats.monthlyPnL >= 0 ? 'up' : 'down'} />
        <StatCard title="Total P&L" value={formatCurrency(stats.totalPnL)} icon={DollarSign} trend={stats.totalPnL >= 0 ? 'up' : 'down'} />
        <StatCard title="Win Rate" value={formatPercentage(stats.winRate)} icon={Target} trend={stats.winRate >= 50 ? 'up' : 'down'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2}} className="lg:col-span-2">
            <Card className="bg-card border border-muted/20 h-full shadow-xl">
            <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                <BarChartHorizontal className="h-5 w-5 text-primary" />
                Key Performance Metrics
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-secondary p-4 rounded-lg border border-muted/20 text-center">
                        <div className="text-sm text-muted-foreground">Total Trades</div>
                        <div className="text-2xl font-bold text-foreground">{stats.totalTrades}</div>
                    </div>
                    <div className="bg-green-600/10 p-4 rounded-lg border border-green-600/20 text-center">
                        <div className="text-sm text-green-700">Winning Trades</div>
                        <div className="text-2xl font-bold text-green-600">{stats.winningTrades}</div>
                    </div>
                    <div className="bg-red-600/10 p-4 rounded-lg border border-red-600/20 text-center">
                        <div className="text-sm text-red-700">Losing Trades</div>
                        <div className="text-2xl font-bold text-red-600">{stats.losingTrades}</div>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg border border-muted/20 text-center">
                        <div className="text-sm text-primary">Avg. R:R</div>
                        <div className="text-2xl font-bold text-primary">{stats.avgRR > 0 ? `${stats.avgRR.toFixed(2)}R` : 'N/A'}</div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-secondary p-3 rounded-md">
                        <span className="text-muted-foreground">Average Win</span>
                        <span className="text-green-600 font-semibold">{formatCurrency(stats.avgWin)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-secondary p-3 rounded-md">
                        <span className="text-muted-foreground">Average Loss</span>
                        <span className="text-red-600 font-semibold">{formatCurrency(stats.avgLoss)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-secondary p-3 rounded-md">
                        <span className="text-muted-foreground">Best Trade</span>
                        <span className="text-green-600 font-semibold">{formatCurrency(stats.bestTrade)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-secondary p-3 rounded-md">
                        <span className="text-muted-foreground">Worst Trade</span>
                        <span className="text-red-600 font-semibold">{formatCurrency(stats.worstTrade)}</span>
                    </div>
                </div>
            </CardContent>
            </Card>
        </motion.div>

        {trades && trades.length > 0 && 
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3}}>
            <Card className="bg-card border border-muted/20 h-full shadow-xl">
                <CardHeader>
                <CardTitle className="text-card-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Recent Trades
                </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-3">
                    {trades.filter(t => t.status !== 'withdrawal').slice(0, 5).map((trade, index) => <motion.div 
                        key={trade.id} 
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: index * 0.1 }} 
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg group transition-all duration-200 hover:bg-accent"
                        >
                        <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${trade.pnl > 0 ? 'bg-green-600' : 'bg-red-600'}`} />
                        <div>
                            <span className="text-card-foreground font-semibold">{trade.symbol}</span>
                            <div className="text-muted-foreground text-xs">
                            {new Date(trade.date).toLocaleDateString()}
                            </div>
                        </div>
                        </div>
                        <div className="flex items-center gap-4">
                        <div className={`font-semibold text-lg ${trade.pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trade.pnl)}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/20" onClick={() => onEdit(trade)}>
                            <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/20" onClick={() => handleDelete(trade)}>
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        </div>
                    </motion.div>)}
                </div>
                </CardContent>
            </Card>
            </motion.div>
        }
      </div>
    </div>;
}