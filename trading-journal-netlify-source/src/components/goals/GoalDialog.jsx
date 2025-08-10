import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { iconMap } from '@/components/goals/iconMap';

export function GoalDialog({ isOpen, setIsOpen, onSave, goal }) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [icon, setIcon] = useState('Target');
  const [unit, setUnit] = useState('custom');
  const [customUnit, setCustomUnit] = useState('');

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setTarget(goal.target || '');
      setCurrent(goal.current || '');
      setIcon(goal.icon || 'Target');
      
      const predefinedUnits = ['ILS', '%', 'trades'];
      if (predefinedUnits.includes(goal.unit)) {
          setUnit(goal.unit);
          setCustomUnit('');
      } else {
          setUnit('custom');
          setCustomUnit(goal.unit || '');
      }

    } else {
      setTitle('');
      setTarget('');
      setCurrent('');
      setIcon('Target');
      setUnit('custom');
      setCustomUnit('');
    }
  }, [goal, isOpen]);

  const handleSubmit = () => {
    const finalUnit = unit === 'custom' ? customUnit : unit;
    onSave({ 
        title, 
        target: Number(target) || 0,
        current: Number(current) || 0,
        icon,
        unit: finalUnit,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="title" className="text-right text-card-foreground">Title</label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3 bg-secondary border text-secondary-foreground" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="current" className="text-right text-card-foreground">Current</label>
            <Input id="current" type="number" value={current} onChange={(e) => setCurrent(e.target.value)} className="col-span-3 bg-secondary border text-secondary-foreground" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="target" className="text-right text-card-foreground">Target</label>
            <Input id="target" type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="col-span-3 bg-secondary border text-secondary-foreground" />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-card-foreground">Unit</label>
            <Select onValueChange={setUnit} value={unit}>
                <SelectTrigger className="col-span-3 bg-secondary border text-secondary-foreground">
                    <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="ILS">ILS (₪)</SelectItem>
                    <SelectItem value="%">Percentage (%)</SelectItem>
                    <SelectItem value="trades">Trades</SelectItem>
                </SelectContent>
            </Select>
          </div>
          
          {unit === 'custom' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="custom-unit" className="text-right text-card-foreground">Custom Unit</label>
              <Input id="custom-unit" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} className="col-span-3 bg-secondary border text-secondary-foreground" placeholder="e.g., Books, Hours" />
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-card-foreground">Icon</label>
              <Select onValueChange={setIcon} value={icon}>
                  <SelectTrigger className="col-span-3 bg-secondary border text-secondary-foreground">
                      <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                      {Object.keys(iconMap).map(iconName => {
                          const IconComponent = iconMap[iconName];
                          return (
                              <SelectItem key={iconName} value={iconName}>
                                  <div className="flex items-center gap-2">
                                      <IconComponent className="h-5 w-5" />
                                      <span>{iconName}</span>
                                  </div>
                              </SelectItem>
                          );
                      })}
                  </SelectContent>
              </Select>
          </div>

        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Goal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>  );
}