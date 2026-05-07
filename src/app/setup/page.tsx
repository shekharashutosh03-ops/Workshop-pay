// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Shield, Check, Loader2, ArrowRight, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'checking' | 'setup' | 'done' | 'already_setup'>('checking');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const res = await fetch('/api/setup');
      const data = await res.json();
      if (data.needsSetup) {
        setStep('setup');
      } else {
        setStep('already_setup');
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch {
      setStep('setup');
    }
  };

  const handleSetup = async () => {
    if (!form.email || !form.password) {
      toast.error('Email and password are required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Setup failed');
        return;
      }

      toast.success('Admin account created successfully!');
      setStep('done');
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      toast.error('Setup failed. Check your Supabase connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary glow-primary mb-8 mx-auto">
          <Sparkles className="w-10 h-10 text-white" />
        </div>

        {step === 'checking' && (
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Checking setup status...</h2>
          </div>
        )}

        {step === 'already_setup' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold">Already set up!</h2>
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        )}

        {step === 'done' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold">Setup Complete!</h2>
            <p className="text-muted-foreground">
              Your admin account is ready. Redirecting to login...
            </p>
          </motion.div>
        )}

        {step === 'setup' && (
          <>
            <div className="text-center space-y-2 mb-8">
              <div className="flex items-center justify-center gap-2 text-primary mb-4">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Initial Setup</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Create Admin Account</h2>
              <p className="text-muted-foreground">
                Set up your administrator account to get started with WorkshopFlow Pro
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    placeholder="Admin User"
                    className="pl-10 h-11 bg-muted/50"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@workshopflow.com"
                    className="pl-10 h-11 bg-muted/50"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    className="pl-10 pr-10 h-11 bg-muted/50"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="w-full h-11 gradient-primary text-white font-medium group"
                onClick={handleSetup}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Create Admin & Start
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              This creates the first admin account. You can add more users later from the dashboard.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
