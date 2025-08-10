import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";
import * as LucideIcons from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { EditableHeader } from '@/components/goals/EditableHeader';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalDialog } from '@/components/goals/GoalDialog';

export function Goals() {
  const {
    goals,
    personalNotes,
    isDialogOpen,
    editingGoal,
    handleNotesChange,
    handleNotesBlur,
    handleSaveGoal,
    handleDeleteGoal,
    openEditDialog,
    openNewDialog,
    setIsDialogOpen
  } = useGoals();
  
  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex justify-between items-center"
      >
        <div className="text-left">
            <EditableHeader 
                initialText="Your Personal Goals"
                tag="h1"
                className="text-4xl font-bold text-foreground mb-2"
                storageKey="goalsPageTitle"
            />
            <EditableHeader
                initialText="Track your progress and stay motivated on your journey to success."
                tag="p"
                className="text-muted-foreground"
                storageKey="goalsPageSubtitle"
            />
        </div>
        <Button onClick={openNewDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground"><LucideIcons.Plus className="mr-2 h-4 w-4" /> Add New Goal</Button>
      </motion.div>
      
      <GoalDialog 
        isOpen={isDialogOpen} 
        setIsOpen={setIsDialogOpen} 
        onSave={handleSaveGoal} 
        goal={editingGoal}
      />
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {goals.map((goal, index) => (
          <motion.div
            key={goal.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.1 }}
          >
            <GoalCard 
              goal={goal} 
              onEdit={openEditDialog} 
              onDelete={handleDeleteGoal} 
            />
          </motion.div>
        ))}
      </motion.div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-card border border-muted/20">
            <CardHeader>
                <CardTitle className="flex items-center text-lg font-medium text-card-foreground">
                    <LucideIcons.BookOpen className="h-6 w-6 mr-3 text-primary" />
                    Personal Notes & Long-Term Vision
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea
                    placeholder="Write down your long-term vision, key learnings, or any thoughts to keep you on track..."
                    value={personalNotes}
                    onChange={handleNotesChange}
                    onBlur={handleNotesBlur}
                    className="min-h-[150px] bg-secondary border text-secondary-foreground focus:ring-primary/40"
                />
            </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
