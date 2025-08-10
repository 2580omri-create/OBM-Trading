import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Award, PiggyBank, Wallet, History } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { useToast } from "@/components/ui/use-toast";

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const WITHDRAWAL_TARGET_DAYS = 5;
const WITHDRAWAL_PROFIT_MINIMUM = 100;

export function WithdrawalProgress({ trades, onWithdraw }) {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [withdrawalAmount, setWithdrawalAmount] = useState('');

    const pastWithdrawals = useMemo(() => {
        return trades
            .filter(t => t.status === 'withdrawal')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [trades]);

    const lastWithdrawalDate = useMemo(() => {
        return pastWithdrawals.length > 0 ? new Date(pastWithdrawals[0].date) : null;
    }, [pastWithdrawals]);
    
    const profitableDays = useMemo(() => {
        const tradesSinceLastWithdrawal = lastWithdrawalDate
            ? trades.filter(t => new Date(t.date) > lastWithdrawalDate)
            : trades;

        const dailyPnl = tradesSinceLastWithdrawal.reduce((acc, trade) => {
            if(trade.status === 'withdrawal') return acc;
            const day = format(new Date(trade.date), 'yyyy-MM-dd');
            if (!acc[day]) {
                acc[day] = 0;
            }
            acc[day] += trade.pnl;
            return acc;
        }, {});

        return Object.entries(dailyPnl)
            .filter(([day, pnl]) => pnl >= WITHDRAWAL_PROFIT_MINIMUM)
            .sort((a, b) => new Date(b[0]) - new Date(a[0]));
    }, [trades, lastWithdrawalDate]);

    const progress = profitableDays.length;
    const isGoalReached = progress >= WITHDRAWAL_TARGET_DAYS;

    const handleWithdraw = () => {
        const amount = parseFloat(withdrawalAmount);
        if(isNaN(amount) || amount <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Amount",
                description: "Please enter a valid positive number for withdrawal.",
            });
            return;
        }
        onWithdraw(amount);
        toast({
            title: "Withdrawal Successful!",
            description: `${formatCurrency(amount)} has been withdrawn. Your progress has been reset.`,
        });
        setWithdrawalAmount('');
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-bold text-primary mb-2">Withdrawal Progress</h1>
                <p className="text-muted-foreground">Track your progress towards your next payout.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                <Card className="bg-card border border-muted/20">
                    <CardHeader>
                        <CardTitle className="text-card-foreground flex items-center gap-2">
                            <Award className="text-primary" />
                            Payout Rule: {WITHDRAWAL_TARGET_DAYS} Profitable Days
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Achieve at least {formatCurrency(WITHDRAWAL_PROFIT_MINIMUM)} profit on {WITHDRAWAL_TARGET_DAYS} different days to be eligible for a withdrawal.</p>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6">
                            <p className="text-lg font-semibold text-foreground mb-3">Your Progress: {progress} / {WITHDRAWAL_TARGET_DAYS} days</p>
                            <div className="flex space-x-4">
                                {Array.from({ length: WITHDRAWAL_TARGET_DAYS }).map((_, index) => (
                                    <motion.div 
                                        key={index}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                                    >
                                        {index < progress ? (
                                            <PiggyBank className="h-12 w-12 text-green-600" />
                                        ) : (
                                            <PiggyBank className="h-12 w-12 text-muted-foreground/60" />
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {isGoalReached && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-green-600/20 border border-green-600 rounded-lg text-center flex flex-col items-center gap-4"
                            >
                                <h3 className="text-xl font-bold text-green-700">Congratulations!</h3>
                                <p className="text-green-600">You've met the requirements for a withdrawal.</p>
                                <Button onClick={() => setIsDialogOpen(true)} className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                                    <Wallet className="mr-2 h-4 w-4" />
                                    Withdraw Now
                                </Button>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-card border border-muted/20">
                    <CardHeader>
                        <CardTitle className="text-card-foreground flex items-center gap-2">
                            <CheckCircle2 className="text-primary" />
                            Qualifying Profitable Days
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {profitableDays.length > 0 ? (
                            <ul className="space-y-3">
                                {profitableDays.map(([day, pnl], index) => (
                                    <motion.li 
                                        key={day}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex justify-between items-center p-3 bg-secondary rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            <span className="font-medium text-secondary-foreground">{format(new Date(day), 'EEEE, MMMM d, yyyy')}</span>
                                        </div>
                                        <span className="font-bold text-green-600">{formatCurrency(pnl)}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No qualifying profitable days yet.</p>
                                <p className="text-muted-foreground/80">Keep trading to reach your goal!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-card border border-muted/20">
                    <CardHeader>
                        <CardTitle className="text-card-foreground flex items-center gap-2">
                            <History className="text-primary" />
                            Withdrawal History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pastWithdrawals.length > 0 ? (
                            <ul className="space-y-3">
                                {pastWithdrawals.map((withdrawal, index) => (
                                    <motion.li 
                                        key={withdrawal.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex justify-between items-center p-3 bg-secondary rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Wallet className="h-5 w-5 text-primary" />
                                            <span className="font-medium text-secondary-foreground">{format(new Date(withdrawal.date), 'MMMM d, yyyy')}</span>
                                        </div>
                                        <span className="font-bold text-primary">{formatCurrency(Math.abs(withdrawal.pnl))}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No past withdrawals recorded.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-card border text-card-foreground">
                    <DialogHeader>
                        <DialogTitle>Request Withdrawal</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Enter the amount you wish to withdraw. This will be recorded and your progress will be reset.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                           type="number"
                           placeholder="e.g., 1500"
                           value={withdrawalAmount}
                           onChange={(e) => setWithdrawalAmount(e.target.value)}
                           className="bg-secondary border text-secondary-foreground"
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                           <Button variant="ghost" className="text-muted-foreground hover:bg-secondary">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleWithdraw} className="bg-primary text-primary-foreground hover:bg-primary/90">Confirm Withdrawal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}