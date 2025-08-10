import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { iconMap } from '@/components/goals/iconMap';

const formatValue = (value, unit) => {
    if (unit === 'ILS') {
      return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(value);
    }
    if (unit === '%') {
      return `${Number(value).toFixed(1)}%`;
    }
    if (unit === 'trades') {
      return Number(value).toFixed(0);
    }
    return `${Number(value).toFixed(0)} ${unit || ''}`.trim();
};

export function GoalCard({ goal, onEdit, onDelete }) {
    const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
    const isCompleted = progress >= 100;
    const GoalIcon = iconMap[goal.icon] || LucideIcons.Target;
  
    return (
      <Card className="bg-card border border-muted/20 hover:border-primary/20 transition-all duration-300 flex flex-col justify-between">
        <div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-card-foreground">{goal.title}</CardTitle>
              <GoalIcon className={cn("h-6 w-6", isCompleted ? "text-green-600" : "text-primary")} />
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-2xl font-bold text-foreground">
                    {formatValue(goal.current, goal.unit)}
                  </span>
                  {goal.target > 0 && (
                     <span className="text-sm text-muted-foreground">
                        / {formatValue(goal.target, goal.unit)}
                     </span>
                  )}
                </div>
                {goal.target > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <Progress value={progress} className={cn("h-3", isCompleted ? "bg-green-600" : "bg-primary")} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{`${progress.toFixed(0)}% Completed`}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                )}
              </div>
              {isCompleted ? (
                <div className="text-sm text-green-600 flex items-center">
                  <LucideIcons.CheckCircle className="h-4 w-4 mr-2" />
                  Goal Achieved!
                </div>
              ) : (
                 goal.target > 0 && (
                    <div className="text-sm text-muted-foreground flex items-center">
                        <LucideIcons.Clock className="h-4 w-4 mr-2" />
                        In Progress
                    </div>
                )
              )}
            </CardContent>
        </div>
        <div className="p-4 pt-0 mt-auto flex gap-2">
            <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-accent" onClick={() => onEdit(goal)}>Edit</Button>
            {!goal.isDefault && (
                <Button variant="destructive" className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => onDelete(goal.id)}>Delete</Button>
            )}
        </div>
      </Card>
    );
};
