
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/components/ui/use-toast";

export function useTrades() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }
      setTrades(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching trades",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const addTrade = async (trade) => {
    if (!user) return;
    const tradeData = { ...trade };
    
    // Clean up old properties if they exist
    delete tradeData.imageUrl;
    delete tradeData.image_url;
    delete tradeData.strategies;
    
    try {
      const { data, error } = await supabase
        .from('trades')
        .insert([{ ...tradeData, user_id: user.id }])
        .select();

      if (error) throw error;
      
      setTrades(prev => [data[0], ...prev]);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error adding trade",
        description: error.message,
      });
    }
  };

  const updateTrade = async (id, updatedTrade) => {
    const tradeData = { ...updatedTrade };

    // Clean up old properties if they exist
    delete tradeData.imageUrl;
    delete tradeData.image_url;
    delete tradeData.strategies;

    try {
      const { data, error } = await supabase
        .from('trades')
        .update(tradeData)
        .eq('id', id)
        .select();
        
      if (error) throw error;

      setTrades(prev => prev.map(t => t.id === id ? data[0] : t));
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error updating trade",
        description: error.message,
      });
    }
  };

  const deleteTrade = async (id) => {
    try {
        const { error } = await supabase
            .from('trades')
            .delete()
            .eq('id', id);

        if (error) throw error;

        setTrades(prev => prev.filter(t => t.id !== id));
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error deleting trade",
            description: error.message,
        });
    }
  };
  
  const addWithdrawal = async (amount) => {
    const withdrawalData = {
        symbol: 'WITHDRAWAL',
        status: 'withdrawal',
        pnl: -parseFloat(amount),
        date: new Date().toISOString(),
        notes: `Withdrew ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}`,
        image_urls: [],
        followed_plan: true
    };
    await addTrade(withdrawalData);
  };

  return {
    trades,
    loading,
    addTrade,
    updateTrade,
    deleteTrade,
    addWithdrawal,
  };
}
