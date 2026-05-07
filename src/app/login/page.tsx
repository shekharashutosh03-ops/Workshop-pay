'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) { toast.error(error.message); return; }
      if (authData.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();
        toast.success('Welcome back!');
        router.push(profile?.role === 'admin' ? '/dashboard' : '/employee/dashboard');
        router.refresh();
      }
    } catch { toast.error('An unexpected error occurred'); }
    finally { setLoading(false); }
  };

  const onSignup = async (data: SignupForm) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.full_name, role: 'admin' } },
      });
      if (error) { toast.error(error.message); return; }
      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: data.full_name,
          email: data.email,
          role: 'admin',
        });
        toast.success('Account created! Redirecting to setup...');
        router.push('/setup');
        router.refresh();
      }
    } catch { toast.error('An unexpected error occurred'); }
    finally { setLoading(false); }
  };

  const switchMode = (next: 'login' | 'signup') => {
    setMode(next);
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 animated-gradient" />
        <div className="absolute inset-0 bg-black/20" />
        <motion.div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" animate={{ x: [0, -40, 0], y: [0, -50, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="relative z-10 flex flex-col items-center justify-center w-full text-white p-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-8 mx-auto ring-1 ring-white/30">
              <Sparkles className="w-10 h-10" />
            </div>
            <h1 className="text-5xl font-bold mb-4 tracking-tight">
              WorkshopFlow
              <span className="block text-2xl font-light mt-1 opacity-80">Pro Platform</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md mx-auto leading-relaxed">
              Enterprise-grade workshop management. Streamline programs, empower teams, track every detail.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-16 grid grid-cols-3 gap-8">
            {[{ value: '500+', label: 'Workshops' }, { value: '10K+', label: 'Participants' }, { value: '99.9%', label: 'Uptime' }].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-white/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl gradient-primary">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">WorkshopFlow Pro</h1>
              <p className="text-xs text-muted-foreground">Management Platform</p>
            </div>
          </div>

          {/* ── Seamless Toggle ── */}
          <div className="relative flex items-center bg-muted rounded-xl p-1 mb-8">
            {/* Sliding pill */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-lg gradient-primary shadow-md"
              animate={mode === 'login'
                ? { left: '4px', right: 'calc(50% + 0px)' }
                : { left: 'calc(50% + 0px)', right: '4px' }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                mode === 'login' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                mode === 'signup' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* ── Animated Form Swap ── */}
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.22 }}
              >
                <div className="space-y-1 mb-6">
                  <h2 className="text-2xl font-bold tracking-tight">Welcome back 👋</h2>
                  <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
                </div>

                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-email" type="email" placeholder="admin@workshopflow.com" className="pl-10 h-11 bg-muted/50 border-muted" {...loginForm.register('email')} />
                    </div>
                    {loginForm.formState.errors.email && <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="pl-10 pr-10 h-11 bg-muted/50 border-muted" {...loginForm.register('password')} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
                  </div>

                  <Button type="submit" className="w-full h-11 gradient-primary text-white font-medium group" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>}
                  </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-6">
                  {"Don't have an account? "}
                  <button onClick={() => switchMode('signup')} className="text-primary hover:underline font-medium">Create one</button>
                </p>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Employees: Use credentials provided by your administrator
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
              >
                <div className="space-y-1 mb-6">
                  <h2 className="text-2xl font-bold tracking-tight">Create your account ✨</h2>
                  <p className="text-muted-foreground text-sm">Set up your admin account to get started</p>
                </div>

                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-name" placeholder="Your full name" className="pl-10 h-11 bg-muted/50 border-muted" {...signupForm.register('full_name')} />
                    </div>
                    {signupForm.formState.errors.full_name && <p className="text-xs text-destructive">{signupForm.formState.errors.full_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-email" type="email" placeholder="you@company.com" className="pl-10 h-11 bg-muted/50 border-muted" {...signupForm.register('email')} />
                    </div>
                    {signupForm.formState.errors.email && <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" className="pl-10 pr-10 h-11 bg-muted/50 border-muted" {...signupForm.register('password')} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signupForm.formState.errors.password && <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>}
                  </div>

                  <Button type="submit" className="w-full h-11 gradient-primary text-white font-medium group" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>}
                  </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-6">
                  Already have an account?{' '}
                  <button onClick={() => switchMode('login')} className="text-primary hover:underline font-medium">Sign in</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
