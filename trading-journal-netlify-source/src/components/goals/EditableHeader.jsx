import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function EditableHeader({ initialText, tag: Tag, className, storageKey }) {
    const [text, setText] = useState(initialText);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        const savedText = localStorage.getItem(storageKey);
        if (savedText) {
            setText(savedText);
        }
    }, [storageKey]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        localStorage.setItem(storageKey, text);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            handleBlur();
        }
    };
    
    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={cn(className, "bg-secondary border-primary/30 p-0 h-auto focus-visible:ring-0 text-secondary-foreground")}
            />
        );
    }

    return (
        <Tag className={cn(className, "cursor-pointer hover:bg-accent p-1 rounded-md transition-colors")} onClick={() => setIsEditing(true)}>
            {text}
        </Tag>
    );
};
