import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, AlertTriangle, CheckCircle, BrainCircuit, Loader2, Zap } from 'lucide-react';
import { getTradingInsights } from '@/lib/ai';

function AiInsights({ trades }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  const handleAnalyze = async () => {
    if (trades.length < 3) {
      toast({
        title: "Not Enough Data",
        description: "Please add at least 3 trades for a meaningful analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setInsights(null);
    try {
      const analysis = await getTradingInsights(trades);
      setInsights(analysis);
      toast({
        title: "Analysis Complete!",
        description: "Your personalized trading insights are ready.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not generate insights. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const InsightCard = ({ icon: Icon, title, content, colorClass, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.2 }}
    >
      <Card className="bg-card border h-full">
        <CardHeader className="flex flex-row items-center gap-3">
          <Icon className={`h-6 w-6 ${colorClass}`} />
          <CardTitle className={`text-xl text-card-foreground`}>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            {content.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-1 text-green-600 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-block p-4 bg-primary rounded-full mb-4">
          <BrainCircuit className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          AI Trading Coach
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Leverage artificial intelligence to analyze your trading patterns, uncover hidden strengths, and identify areas for improvement to maximize your profitability.
        </p>
      </motion.div>

      <div className="text-center">
        <Button
          onClick={handleAnalyze}
          disabled={isLoading}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-5 w-5" />
              Analyze My Trades
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {insights && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8"
          >
            <InsightCard
              icon={Lightbulb}
              title="Strengths"
              content={insights.strengths}
              colorClass="text-green-600"
              delay={0}
            />
            <InsightCard
              icon={AlertTriangle}
              title="Areas for Improvement"
              content={insights.weaknesses}
              colorClass="text-red-600"
              delay={1}
            />
            <InsightCard
              icon={CheckCircle}
              title="Actionable Advice"
              content={insights.suggestions}
              colorClass="text-primary"
              delay={2}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { AiInsights };
