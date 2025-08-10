import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Search, Filter, TrendingUp, TrendingDown, GitCompareArrows, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export function TradeList({ trades, onEdit, onDelete }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [expandedImage, setExpandedImage] = useState(null);

  const filteredTrades = trades
    .filter(trade => {
      const matchesSearch = (trade.symbol?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (trade.strategy?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (trade.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'win' && trade.status === 'win') ||
                           (filterType === 'loss' && trade.status === 'loss');
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'pnl':
          return (b.pnl || 0) - (a.pnl || 0);
        case 'rr':
          return (b.rr || 0) - (a.rr || 0);
        case 'symbol':
          return (a.symbol || '').localeCompare(b.symbol || '');
        case 'date':
        default:
          return new Date(b.date || 0) - new Date(a.date || 0);
      }
    });

  const handleDelete = (trade) => {
    onDelete(trade.id);
    toast({
      title: "Trade Deleted",
      description: `Removed ${trade.symbol} trade from journal`,
    });
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-foreground mb-2">Trade History</h1>
        <p className="text-muted-foreground text-lg">Manage and analyze your trading history.</p>
      </motion.div>
      
      <Card className="bg-card border border-muted/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Filter className="h-5 w-5 text-primary" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border text-secondary-foreground"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-secondary border text-secondary-foreground">
                <SelectValue placeholder="Filter by result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="win">Wins</SelectItem>
                <SelectItem value="loss">Losses</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-secondary border text-secondary-foreground">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="pnl">P&L</SelectItem>
                <SelectItem value="rr">R:R</SelectItem>
                <SelectItem value="symbol">Symbol</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTrades.map((trade, index) => (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ translateY: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
          >
            <Card className="bg-card border border-muted/20 transition-all duration-300 flex flex-col h-full shadow-xl">
                {trade.image_urls && trade.image_urls.length > 0 && (
                  <div className="relative group">
                    <img src={trade.image_urls[0]} alt={`Trade for ${trade.symbol}`} className="w-full h-48 object-cover rounded-t-lg" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setExpandedImage(trade.image_urls[0])}>
                       <ImageIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                )}
              <CardContent className="p-5 flex-grow flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-card-foreground">{trade.symbol || 'N/A'}</h3>
                    {trade.status && (
                      <Badge 
                        className={cn("text-white", trade.status === 'win' ? 'bg-green-600' : 'bg-red-600')}
                      >
                        {trade.status.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className={`flex items-center gap-2 text-2xl font-bold ${
                      trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.pnl >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                      {formatCurrency(trade.pnl)}
                    </div>
                    {typeof trade.rr === 'number' && (
                      <div className="flex items-center gap-1 text-lg text-primary font-semibold">
                        <GitCompareArrows className="h-5 w-5" />
                        <span>{trade.rr}R</span>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Strategy:
                    <span className="text-primary ml-2 font-medium">{trade.strategy || 'N/A'}</span>
                  </div>

                   <div className="text-sm text-muted-foreground">
                    Date: <span className="ml-2 font-medium text-card-foreground">{formatDate(trade.date)}</span>
                  </div>
                  
                  {trade.followed_plan !== null && (
                    <div className={`flex items-center text-sm ${trade.followed_plan ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.followed_plan ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                      <span>{trade.followed_plan ? 'Followed Plan' : 'Deviated from Plan'}</span>
                    </div>
                  )}

                  {trade.notes && (
                    <p className="text-muted-foreground bg-secondary p-3 rounded-lg h-24 overflow-y-auto border border-muted/20">
                      {trade.notes}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(trade)}
                    className="flex-1 border-primary/30 text-primary hover:bg-accent"
                  >
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(trade)}
                    className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {filteredTrades.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card border border-muted/20 shadow-xl">
                <CardContent className="p-12 text-center">
                    <div className="text-muted-foreground text-lg">No trades found</div>
                    <div className="text-muted-foreground/80 text-sm mt-2">
                    {searchTerm || filterType !== 'all' 
                        ? 'Try adjusting your filters or search terms'
                        : 'Start by adding your first trade'
                    }
                    </div>
                </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {expandedImage && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setExpandedImage(null)}
            >
            <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                src={expandedImage}
                alt="Expanded trade"
                className="max-w-full max-h-full rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
