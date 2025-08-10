import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Target, ShieldAlert, BadgeCheck, Settings, HelpCircle, Save } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const challengeOptions = {
    "50K": { profitTarget: 3000, maxDrawdown: 2000, startingBalance: 50000 },
    "100K": { profitTarget: 6000, maxDrawdown: 3500, startingBalance: 100000 },
    "150K": { profitTarget: 9000, maxDrawdown: 5000, startingBalance: 150000 },
};

export function FundedProgress({ trades }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [accountSize, setAccountSize] = useState('100K');
    const [showSettings, setShowSettings] = useState(false);
    const [customRules, setCustomRules] = useState(challengeOptions[accountSize]);
    const [loadingSettings, setLoadingSettings] = useState(true);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
        setLoadingSettings(true);
        try {
            const { data, error } = await supabase
                .from('funded_account_settings')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) { 
                throw error;
            }

            if (data) {
                setAccountSize(data.account_size);
                setCustomRules({
                    profitTarget: data.profit_target,
                    maxDrawdown: data.max_drawdown,
                    startingBalance: data.starting_balance,
                });
            } else {
                // No settings found, use defaults
                setAccountSize('100K');
                setCustomRules(challengeOptions['100K']);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to load settings", description: error.message });
        } finally {
            setLoadingSettings(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSaveSettings = async () => {
        if (!user) return;
        try {
            const settingsData = {
                user_id: user.id,
                account_size: accountSize,
                profit_target: customRules.profitTarget,
                max_drawdown: customRules.maxDrawdown,
                starting_balance: customRules.startingBalance,
            };

            const { error } = await supabase
                .from('funded_account_settings')
                .upsert(settingsData, { onConflict: 'user_id' });

            if (error) throw error;

            toast({ title: "Settings Saved!", description: "Your funded account settings have been saved." });
            setShowSettings(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Failed to save settings", description: error.message });
        }
    };

    const handleAccountSizeChange = (size) => {
        setAccountSize(size);
        if (challengeOptions[size]) {
            setCustomRules(challengeOptions[size]);
        }
    };
    
    const handleCustomRuleChange = (e) => {
        const { name, value } = e.target;
        setCustomRules(prev => ({...prev, [name]: parseFloat(value) || 0 }));
    }

    // Calculations
    const totalPnl = trades.reduce((acc, trade) => acc + trade.pnl, 0);
    const currentBalance = customRules.startingBalance + totalPnl;
    
    const historicalHigh = trades.reduce((max, trade, index) => {
        const runningPnl = trades.slice(0, index + 1).reduce((pnl, t) => pnl + t.pnl, 0);
        return Math.max(max, customRules.startingBalance + runningPnl);
    }, customRules.startingBalance);
    
    const trailingDrawdown = historicalHigh - currentBalance;

    const progressData = {
        profitTarget: {
            value: totalPnl,
            target: customRules.profitTarget,
            label: "Profit Target",
            icon: Target,
            tooltip: `Reach ${formatCurrency(customRules.profitTarget)} in profit.`
        },
        maxDrawdown: {
            value: trailingDrawdown,
            target: customRules.maxDrawdown,
            label: "Max Trailing Drawdown",
            icon: ShieldAlert,
            isViolation: trailingDrawdown > customRules.maxDrawdown,
            tooltip: `Your account balance cannot drop ${formatCurrency(customRules.maxDrawdown)} below its highest point.`
        }
    };
    
    const ProgressCard = ({ data }) => {
        const { value, target, label, icon: Icon, isViolation, tooltip } = data;
        const percentage = Math.min((value / target) * 100, 100);
        const isLossRule = label.toLowerCase().includes('loss') || label.toLowerCase().includes('drawdown');
        
        return (
            <Card className="bg-card border border-muted/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${isViolation ? 'text-destructive' : 'text-primary'}`} />
                        {label}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground/60 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{tooltip}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </CardTitle>
                    {isViolation && <BadgeCheck className="h-5 w-5 text-destructive" />}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground mb-2">
                        {formatCurrency(value)}
                        {!isLossRule && <span className="text-base text-muted-foreground"> / {formatCurrency(target)}</span>}
                         {isLossRule && <span className="text-base text-muted-foreground"> of max {formatCurrency(target)}</span>}
                    </div>
                    <Progress 
                        value={percentage} 
                        className={isLossRule ? (isViolation ? "bg-destructive" : "bg-green-600") : ""} 
                        indicatorClassName={isLossRule ? '' : `bg-primary`}
                    />
                </CardContent>
            </Card>
        );
    };

    const SettingsPanel = () => (
        <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="overflow-hidden">
        <Card className="bg-card border border-muted/20 mb-6">
            <CardHeader>
                <CardTitle className="text-card-foreground">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-card-foreground">Account Size</label>
                      <Select value={accountSize} onValueChange={handleAccountSizeChange}>
                          <SelectTrigger className="bg-secondary border text-secondary-foreground"><SelectValue/></SelectTrigger>
                          <SelectContent>
                              {Object.keys(challengeOptions).map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}
                          </SelectContent>
                      </Select>
                    </div>
                     {Object.entries(customRules).map(([key, value]) => (
                        <div key={key}>
                            <label className="block text-sm font-medium mb-2 text-card-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <Input type="number" name={key} value={value} onChange={handleCustomRuleChange} className="bg-secondary border text-secondary-foreground" />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90">
                        <Save className="mr-2 h-4 w-4" />
                        Save Settings
                    </Button>
                </div>
            </CardContent>
        </Card>
        </motion.div>
    );
    
    if (loadingSettings) {
        return <div className="text-center text-foreground">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">Funded Account Progress</h1>
                    <p className="text-muted-foreground">Track your performance against your funding challenge rules.</p>
                </div>
                <Button variant="ghost" onClick={() => setShowSettings(!showSettings)} className="text-muted-foreground hover:bg-accent">
                    <Settings className="mr-2 h-4 w-4" />
                    {showSettings ? 'Close Settings' : 'Edit Settings'}
                </Button>
            </motion.div>
            
            {showSettings && <SettingsPanel />}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card border border-muted/20 col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-card-foreground flex items-center gap-2"><TrendingUp className="text-green-600"/>Account Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-around text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Starting Balance</p>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(customRules.startingBalance)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Current P&L</p>
                            <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalPnl)}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Current Balance</p>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(currentBalance)}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Peak Balance</p>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(historicalHigh)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.values(progressData).map(data => (
                    <motion.div key={data.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                       <ProgressCard data={data} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}