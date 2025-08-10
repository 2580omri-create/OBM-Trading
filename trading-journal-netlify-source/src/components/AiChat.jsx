import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Loader2, User, Bot, Sparkles, RefreshCw } from 'lucide-react';
import { getAiChatResponse, resetConversation } from '@/lib/aiChat';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useTrades } from '@/hooks/useTrades';

const initialMessage = {
    role: 'bot',
    content: "שלום! אני מאמן המסחר האישי שלך. אני מבין עברית ואנגלית, זוכר את השיחות שלנו, ויכול לעזור לך לנתח את הביצועים, לתעד עסקאות, ועוד.\n\nאיך אני יכול לעזור לך היום?"
};

export function AiChat() {
    const { toast } = useToast();
    const { trades, addTrade, updateTrade, deleteTrade } = useTrades();
    const [messages, setMessages] = useState([initialMessage]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [isRtl, setIsRtl] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        const hebrewChars = /[\u0590-\u05FF]/;
        setIsRtl(hebrewChars.test(input) || input.length === 0);
    }, [input]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await getAiChatResponse(userMessage.content, trades);

            if (response.actions) {
                for (const action of response.actions) {
                    if (action.type === 'add_trade' && action.payload) {
                        await addTrade(action.payload);
                        toast({ title: "העסקה נוספה!", description: `עסקת ${action.payload.symbol} נוספה בהצלחה.` });
                    }
                    if (action.type === 'update_trade' && action.payload) {
                        await updateTrade(action.payload.id, action.payload.updates);
                        toast({ title: "העסקה עודכנה!", description: `עסקת ${action.payload.id} עודכנה.` });
                    }
                    if (action.type === 'delete_trade' && action.payload) {
                        await deleteTrade(action.payload.id);
                        toast({ title: "העסקה נמחקה!", description: `עסקת ${action.payload.id} נמחקה.` });
                    }
                }
            }

            setMessages(prev => [...prev, { role: 'bot', content: response.content }]);
        } catch (error) {
            console.error("AI Chat Error:", error);
            toast({
                title: 'שגיאה',
                description: 'נכשל בקבלת תגובה מהעוזר החכם.',
                variant: 'destructive',
            });
            setMessages(prev => [...prev, { role: 'bot', content: 'סליחה, נתקלתי בשגיאה. אנא נסה שוב.' }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        resetConversation();
        setMessages([initialMessage]);
        toast({ title: "השיחה אופסה", description: "התחלנו שיחה חדשה." });
    };
    
    const exampleQuestions = [
        "הפסדתי 150 דולר ב-NQ",
        "מה ה-win rate שלי?",
        "מה הטרייד הכי טוב שלי?"
    ];

    const MessageContent = ({ content }) => {
        const hebrewChars = /[\u0590-\u05FF]/;
        const containsHebrew = hebrewChars.test(content);
        return (
            <div dir={containsHebrew ? "rtl" : "ltr"} className={cn("prose prose-sm max-w-none", containsHebrew ? "text-right" : "text-left")}>
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-12rem)] flex flex-col">
            <Card className="bg-card border flex-grow flex flex-col overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-bold text-foreground">AI Coach</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-secondary">
                    {messages.map((message, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {message.role === 'bot' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-primary-foreground" />
                                </div>
                            )}
                            <div className={`max-w-xl p-3 rounded-xl shadow-sm ${message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card text-card-foreground'
                                }`}
                            >
                                <MessageContent content={message.content} />
                            </div>
                            {message.role === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <Bot className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div className="max-w-xl p-3 rounded-xl bg-card text-card-foreground flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>חושב...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t bg-card">
                    <div className="flex gap-2 mb-2 justify-end" dir="rtl">
                        {exampleQuestions.map(q => (
                            <Button key={q} size="sm" variant="outline" className="text-primary border-primary/30 hover:bg-accent" onClick={() => setInput(q)}>
                                {q}
                            </Button>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={"שאל אותי משהו..."}
                            className="bg-secondary border text-secondary-foreground"
                            dir={isRtl ? 'rtl' : 'ltr'}
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !input.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
