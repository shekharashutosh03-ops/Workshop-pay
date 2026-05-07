'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Sparkles, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success('Password reset email sent!');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary glow-primary mb-8 mx-auto">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="text-muted-foreground">
              We&apos;ve sent a password reset link to your email address.
            </p>
            <Link href="/login">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold tracking-tight">Forgot password?</h2>
              <p className="text-muted-foreground">
                No worries, we&apos;ll send you reset instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@workshopflow.com"
                    className="pl-10 h-11 bg-muted/50 border-muted"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11 gradient-primary text-white" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
              </Button>
            </form>

            <div className="text-center mt-6">
              <Link href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                Back to login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
