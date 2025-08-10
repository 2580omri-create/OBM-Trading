
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { Dashboard } from '@/components/Dashboard';
import { TradeForm } from '@/components/TradeForm';
import { TradeList } from '@/components/TradeList';
import { AiChat } from '@/components/AiChat';
import { CalendarView } from '@/components/CalendarView';
import { Goals } from '@/components/Goals';
import { FundedProgress } from '@/components/FundedProgress';
import { WithdrawalProgress } from '@/components/WithdrawalProgress';
import { useTrades } from '@/hooks/useTrades';
import { BarChart3, Plus, List, Home, Calendar as CalendarIcon, Target, MessageCircle, Banknote, LogOut, Menu, X, Bot, Rocket } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AuthForm } from '@/components/AuthForm';
import { cn } from '@/lib/utils';
import { AiInsights } from '@/components/AiInsights';

function App() {
  const { user, signOut, loading: authLoading } = useAuth();
  const {
    trades,
    addTrade,
    updateTrade,
    deleteTrade,
    addWithdrawal,
    loading: tradesLoading,
  } = useTrades();
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingTrade, setEditingTrade] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleAddTrade = tradeData => {
    addTrade(tradeData);
    setCurrentView('trades');
  };
  
  const handleAiAddTrade = tradeData => {
    addTrade(tradeData);
  };

  const handleEditTrade = trade => {
    setEditingTrade(trade);
    setCurrentView('add');
  };

  const handleUpdateTrade = tradeData => {
    updateTrade(editingTrade.id, tradeData);
    setEditingTrade(null);
    setCurrentView('trades');
  };

  const handleCancelEdit = () => {
    setEditingTrade(null);
    setCurrentView(trades.length > 0 ? 'trades' : 'dashboard');
  };

  const navItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home
  }, {
    id: 'trades',
    label: 'Trades',
    icon: List
  }, {
    id: 'funded-progress',
    label: 'Challenges',
    icon: Rocket
  }, {
    id: 'withdrawal-progress',
    label: 'Withdrawals',
    icon: Banknote
  }, {
    id: 'calendar',
    label: 'Calendar',
    icon: CalendarIcon
  }, {
    id: 'goals',
    label: 'Goals',
    icon: Target
  }, {
    id: 'ai-insights',
    label: 'AI Insights',
    icon: Bot
  },{
    id: 'ai-chat',
    label: 'AI Chat',
    icon: MessageCircle
  }];
  
  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view !== 'add') setEditingTrade(null);
    if(window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const renderContent = () => {
    if (authLoading || tradesLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-foreground text-2xl">Loading...</div>
        </div>
      );
    }
    
    switch (currentView) {
      case 'dashboard':
        return <Dashboard trades={trades} onEdit={handleEditTrade} onDelete={deleteTrade} />;
      case 'trades':
        return <TradeList trades={trades} onEdit={handleEditTrade} onDelete={deleteTrade} />;
      case 'funded-progress':
        return <FundedProgress trades={trades} />;
      case 'withdrawal-progress':
        return <WithdrawalProgress trades={trades} onWithdraw={addWithdrawal} />;
      case 'calendar':
        return <CalendarView trades={trades} />;
       case 'goals':
        return <Goals />;
      case 'add':
        return <TradeForm onSubmit={editingTrade ? handleUpdateTrade : handleAddTrade} trade={editingTrade} onCancel={editingTrade ? handleCancelEdit : null} />;
      case 'ai-insights':
        return <AiInsights trades={trades} />;
      case 'ai-chat':
        return <AiChat trades={trades} addTrade={handleAiAddTrade} />;
      default:
        return <Dashboard trades={trades} onEdit={handleEditTrade} onDelete={deleteTrade} />;
    }
  };

  if (!user) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <AuthForm />
            <Toaster />
        </div>
    );
  }
  
  const Sidebar = () => (
    <aside className={cn(
      "fixed top-0 left-0 h-full bg-secondary border-r border-secondary z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 w-64",
      isSidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
       <div className="flex flex-col h-full">
         <div className="flex items-center justify-between h-20 px-6 border-b border-secondary">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg shadow-md">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-white">
                TradeJournal
              </span>
           </motion.div>
           <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-6 w-6 text-white/70"/>
           </Button>
         </div>

         <nav className="flex-1 px-4 py-6 space-y-2">
           {navItems.map((item, index) => {
             const Icon = item.icon;
             return <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                 <Button 
                   variant={"ghost"}
                   onClick={() => handleViewChange(item.id)} 
                   className={cn(
                     "w-full justify-start text-md py-6 rounded-lg",
                     currentView === item.id 
                       ? "bg-primary/20 text-white font-semibold" 
                       : "text-white/70 hover:text-white hover:bg-primary/10"
                   )}>
                   <Icon className={cn("h-5 w-5 mr-4")} />
                   {item.label}
                 </Button>
               </motion.div>;
           })}
         </nav>

         <div className="px-4 py-6 mt-auto border-t border-secondary space-y-3">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (navItems.length) * 0.05 }}>
            <Button variant="default" onClick={() => handleViewChange('add')} className="w-full text-md py-6 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300">
                <Plus className="h-5 w-5 mr-3" />
                Add New Trade
            </Button>
           </motion.div>
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (navItems.length + 1) * 0.05 }}>
             <Button variant="ghost" onClick={signOut} className="w-full justify-start text-md py-6 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                 <LogOut className="h-5 w-5 mr-3" />
                 Sign Out
             </Button>
           </motion.div>
         </div>
       </div>
    </aside>
  );

  return <>
      <Helmet>
        <title>TradeJournal - Professional Trading Journal</title>
        <meta name="description" content="The ultimate trading journal to track, analyze, and improve your trading performance with powerful analytics and AI insights." />
      </Helmet>
      
      <div className="min-h-screen bg-background text-foreground">
        <div className="lg:pl-64">
           <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              />
            )}
           </AnimatePresence>
          <Sidebar />

          <header className="sticky top-0 bg-secondary z-30 lg:hidden flex items-center justify-between h-20 px-6 border-b border-secondary">
             <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg shadow-md">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-white">
                TradeJournal
              </span>
           </motion.div>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-6 w-6 text-white/70"/>
            </Button>
          </header>

          <main className="p-4 sm:p-6 lg:p-10">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentView} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }} 
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <Toaster />
      </div>
    </>;
}
export default App;
