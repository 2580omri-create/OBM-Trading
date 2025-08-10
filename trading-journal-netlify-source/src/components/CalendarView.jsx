import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isFuture,
  parseISO
} from 'date-fns';
import { he } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function CalendarView({ trades }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);

  const tradesByDate = useMemo(() => {
    const grouped = {};
    trades.forEach(trade => {
      const day = format(parseISO(trade.date), 'yyyy-MM-dd');
      if (!grouped[day]) {
        grouped[day] = { pnl: 0, count: 0, trades: [], hasWithdrawal: false };
      }
      
      grouped[day].pnl += trade.pnl;

      if (trade.status === 'withdrawal') {
          grouped[day].hasWithdrawal = true;
          grouped[day].trades.push({
              ...trade,
              result: 'משיכה'
          });
      } else {
          grouped[day].count += 1;
          grouped[day].trades.push({
              ...trade,
              rr: (Math.random() * 5).toFixed(2), // Mock RR
              result: trade.pnl > 0 ? 'נצחון' : 'הפסד'
          });
      }
    });
    return grouped;
  }, [trades]);

  const handleDayClick = (day) => {
    if (isFuture(day) && !isToday(day)) return;

    const dayStr = format(day, 'yyyy-MM-dd');
    if (tradesByDate[dayStr]) {
        setSelectedDay(day);
        setIsDrawerOpen(true);
    } else {
        setSelectedDay(day);
        setIsDrawerOpen(true); // Open drawer even for days with no trades
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: he });
  const endDate = endOfWeek(monthEnd, { locale: he });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date(), { locale: he }),
    end: endOfWeek(new Date(), { locale: he }),
  }).map(day => format(day, 'EEEE', { locale: he }));

  const selectedDayTrades = selectedDay ? tradesByDate[format(selectedDay, 'yyyy-MM-dd')] : null;

  return (
    <>
      <TooltipProvider>
        <motion.div
          dir="rtl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card border rounded-lg shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-6 pt-6">
              <CardTitle className="text-2xl font-bold text-card-foreground">
                {format(currentMonth, 'MMMM yyyy', { locale: he })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={nextMonth} className="text-muted-foreground hover:bg-accent">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={prevMonth} className="text-muted-foreground hover:bg-accent">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <div className="grid grid-cols-7 gap-1 text-center text-sm text-muted-foreground mb-2">
                {weekDays.map(day => <div key={day}>{day}</div>)}
              </div>
              <div className="grid grid-cols-7 grid-rows-6 gap-2">
                {days.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const data = tradesByDate[dayStr];
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const isCurrent = isSameMonth(day, currentMonth);
                  const isFutureDay = isFuture(day) && !isToday(day);

                  return (
                    <motion.div
                      key={dayStr}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "relative aspect-square rounded-lg transition-all duration-300 flex items-center justify-center p-2",
                        isFutureDay ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                        isToday(day) && !isSelected && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
                        !isSelected && data && data.hasWithdrawal && "bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/50",
                        !isSelected && data && !data.hasWithdrawal && data.pnl > 0 && "bg-green-600/10 hover:bg-green-600/20",
                        !isSelected && data && !data.hasWithdrawal && data.pnl < 0 && "bg-red-600/10 hover:bg-red-600/20",
                        !isSelected && (!data || data.pnl === 0) && isCurrent && "bg-secondary hover:bg-secondary/80",
                        !isCurrent && !isSelected && "bg-transparent text-muted-foreground/60"
                      )}
                      layoutId={`day-${dayStr}`}
                    >
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            className={cn(
                              "absolute inset-0 rounded-lg flex flex-col items-center justify-center text-white z-10",
                              data && data.hasWithdrawal && "bg-cyan-500/80 shadow-lg",
                              data && !data.hasWithdrawal && data.pnl > 0 && "bg-green-600/80 shadow-lg",
                              data && !data.hasWithdrawal && data.pnl < 0 && "bg-red-600/80 shadow-lg",
                              (!data || data.pnl === 0) && "bg-primary/80 shadow-lg"
                            )}
                            layoutId={`day-bg-${dayStr}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          >
                             <span className="text-2xl font-bold">{format(day, 'd')}</span>
                             {data ? (
                               <>
                                 <span className="font-semibold">{formatCurrency(data.pnl)}</span>
                                 <span className="text-xs opacity-80">{data.count > 0 ? `${data.count} עסקאות` : ''} {data.hasWithdrawal ? 'משיכה' : ''}</span>
                               </>
                             ) : (
                              <span className="text-xs opacity-80">אין נתונים</span>
                             )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex flex-col items-center justify-center">
                         <span className={cn("absolute top-1 right-2 font-medium", !isCurrent && "text-muted-foreground/60")}>
                             {format(day, 'd')}
                         </span>
                         {isCurrent && data && !isSelected && (
                           <div className="mt-4 text-center">
                             <p className={cn(
                               "font-bold text-lg",
                               data.hasWithdrawal && "text-cyan-600",
                               !data.hasWithdrawal && data.pnl > 0 && "text-green-600",
                               !data.hasWithdrawal && data.pnl < 0 && "text-red-600",
                               !data.hasWithdrawal && data.pnl === 0 && "text-card-foreground"
                             )}>
                               {formatCurrency(data.pnl)}
                             </p>
                             <p className="text-xs text-muted-foreground">{data.count > 0 ? `${data.count} עסקאות` : ''} {data.hasWithdrawal ? 'משיכה' : ''}</p>
                           </div>
                         )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TooltipProvider>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
          <DrawerContent className="bg-card text-card-foreground" dir="rtl">
              {selectedDay && (
                  <>
                      <DrawerHeader>
                          <DrawerTitle className="text-xl">
                              פעילות עבור {format(selectedDay, 'd MMMM yyyy', { locale: he })}
                          </DrawerTitle>
                      </DrawerHeader>
                      <div className="p-4 overflow-y-auto h-full">
                          {selectedDayTrades && selectedDayTrades.trades.length > 0 ? (
                              <div className="space-y-4">
                                  {selectedDayTrades.trades.map(trade => (
                                      <motion.div
                                          key={trade.id}
                                          initial={{ opacity: 0, x: 20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ duration: 0.3 }}
                                          className={cn("p-4 rounded-lg bg-secondary border",
                                            trade.status === 'withdrawal' ? "border-cyan-500/50" : "border"
                                          )}
                                      >
                                          {trade.status === 'withdrawal' ? (
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <Banknote className="h-6 w-6 text-cyan-600" />
                                                    <span className="font-bold text-lg text-cyan-700">משיכה</span>
                                                </div>
                                                <span className="font-bold text-cyan-600">{formatCurrency(Math.abs(trade.pnl))}</span>
                                            </div>
                                          ) : (
                                            <>
                                              <div className="flex justify-between items-start mb-2">
                                                  <div>
                                                      <span className="font-bold text-lg">{trade.symbol}</span>
                                                      <span className={cn(
                                                          "font-semibold px-3 py-1 rounded-full text-sm ml-2",
                                                          trade.pnl > 0 ? "bg-green-600/20 text-green-700" : "bg-red-600/20 text-red-700"
                                                      )}>{trade.result}</span>
                                                  </div>
                                                  {trade.imageUrl && (
                                                    <img
                                                      src={trade.imageUrl}
                                                      alt="Trade thumbnail"
                                                      className="w-16 h-16 object-cover rounded-md cursor-pointer"
                                                      onClick={() => setExpandedImage(trade.imageUrl)}
                                                    />
                                                  )}
                                              </div>
                                              <div className="flex justify-between items-center text-muted-foreground">
                                                  <div className="flex items-center gap-1">
                                                      {trade.pnl >= 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                                                      <span className={cn("font-bold", trade.pnl > 0 ? "text-green-600" : "text-red-600")}>{formatCurrency(trade.pnl)}</span>
                                                  </div>
                                                  <span>RR: {trade.rr}</span>
                                                  <span>{format(parseISO(trade.date), 'HH:mm')}</span>
                                              </div>
                                            </>
                                          )}
                                      </motion.div>
                                  ))}
                              </div>
                          ) : (
                              <div className="flex items-center justify-center h-full text-muted-foreground">
                                  <p>אין פעילות להצגה עבור יום זה.</p>
                              </div>
                          )}
                      </div>
                  </>
              )}
          </DrawerContent>
      </Drawer>

       {expandedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            src={expandedImage}
            alt="Expanded trade"
            className="max-w-full max-h-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </>
  );
}
