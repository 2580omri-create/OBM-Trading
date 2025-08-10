
import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setLoading] = useState('');
  const [loading, setLoadingAuth] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingAuth(true);
    if (isSignUp) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
    setLoadingAuth(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-[380px] bg-card text-card-foreground shadow-lg border">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-3 mb-4">
                <div className="p-3 bg-primary rounded-lg shadow-md">
                  <BarChart3 className="h-8 w-8 text-primary-foreground" />
                </div>
                <span className="text-3xl font-bold text-foreground">TradeJournal</span>
            </div>
          <CardTitle className="text-2xl">{isSignUp ? 'Create an Account' : 'Welcome Back!'}</CardTitle>
          <CardDescription className="text-muted-foreground">{isSignUp ? 'Enter your details to get started.' : 'Sign in to access your journal.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-card-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="bg-secondary border text-secondary-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-card-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setLoading(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-secondary border text-secondary-foreground"
              />
            </div>
            <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="text-primary">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
