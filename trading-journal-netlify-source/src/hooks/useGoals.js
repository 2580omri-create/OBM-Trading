
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const defaultGoalsData = [
    {
      title: 'Monthly P&L Target',
      target: 5000,
      current: 0,
      unit: 'ILS',
      icon: 'DollarSign',
      is_default: true,
    },
    {
      title: 'Win Rate Goal',
      target: 60,
      current: 0,
      unit: '%',
      icon: 'TrendingUp',
      is_default: true,
    },
    {
      title: 'Trades per Month',
      target: 50,
      current: 0,
      unit: 'trades',
      icon: 'Target',
      is_default: true,
    },
];

export function useGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState([]);
  const [personalNotes, setPersonalNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fetchGoals = useCallback(async () => {
    if (!user) return;
    try {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id);

        if (error) throw error;
        
        if (data && data.length > 0) {
            setGoals(data);
        } else {
            // If no goals, insert defaults
            const goalsToInsert = defaultGoalsData.map(g => ({ ...g, user_id: user.id }));
            const { data: newGoals, error: insertError } = await supabase
                .from('goals')
                .insert(goalsToInsert)
                .select();
            if (insertError) throw insertError;
            setGoals(newGoals);
        }
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to load goals", description: error.message });
    }
  }, [user, toast]);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    try {
        const { data, error } = await supabase
            .from('personal_notes')
            .select('notes')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) throw error;
        if (data) {
            setPersonalNotes(data.notes);
        } else {
            setPersonalNotes('');
        }
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to load notes", description: error.message });
    }
  }, [user, toast]);

  useEffect(() => {
    if(user) {
        setLoading(true);
        Promise.all([fetchGoals(), fetchNotes()]).finally(() => setLoading(false));
    }
  }, [user, fetchGoals, fetchNotes]);


  const handleNotesChange = (e) => {
    setPersonalNotes(e.target.value);
  };
  
  const handleNotesBlur = async () => {
    if (!user) return;
    try {
        const { error } = await supabase
            .from('personal_notes')
            .upsert({ user_id: user.id, notes: personalNotes, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

        if (error) throw error;
        toast({
            title: "Notes Saved",
            description: "Your personal notes have been successfully saved.",
        });
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to save notes", description: error.message });
    }
  };

  const handleSaveGoal = async (goalData) => {
    if (!user) return;
    try {
        if (editingGoal) {
            const { data, error } = await supabase
                .from('goals')
                .update(goalData)
                .eq('id', editingGoal.id)
                .select();
            if (error) throw error;
            setGoals(goals.map(g => g.id === editingGoal.id ? data[0] : g));
            toast({ title: "Goal Updated!", description: `"${goalData.title}" has been updated.` });
        } else {
            const { data, error } = await supabase
                .from('goals')
                .insert([{ ...goalData, user_id: user.id }])
                .select();
            if (error) throw error;
            setGoals([...goals, data[0]]);
            toast({ title: "Goal Added!", description: `New goal "${goalData.title}" has been added.` });
        }
        setEditingGoal(null);
        setIsDialogOpen(false);
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to save goal", description: error.message });
    }
  };
  
  const handleDeleteGoal = async (id) => {
    const goalToDelete = goals.find(g => g.id === id);
    if (goalToDelete && !goalToDelete.is_default) {
      try {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) throw error;
        setGoals(goals.filter(g => g.id !== id));
        toast({ title: "Goal Removed", description: `"${goalToDelete.title}" has been removed.`, variant: "destructive" });
      } catch (error) {
        toast({ variant: "destructive", title: "Failed to remove goal", description: error.message });
      }
    }
  };
  
  const openEditDialog = (goal) => {
    setEditingGoal(goal);
    setIsDialogOpen(true);
  };
  
  const openNewDialog = () => {
    setEditingGoal(null);
    setIsDialogOpen(true);
  };

  return {
    goals,
    personalNotes,
    isDialogOpen,
    editingGoal,
    loading,
    handleNotesChange,
    handleNotesBlur,
    handleSaveGoal,
    handleDeleteGoal,
    openEditDialog,
    openNewDialog,
    setIsDialogOpen
  };
}
