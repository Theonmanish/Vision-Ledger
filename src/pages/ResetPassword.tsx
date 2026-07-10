import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { GlassCard } from '../components/ui/glass-card';
import { Container } from '../components/ui/container';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    // Check if we have a valid recovery token in the URL
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setValidToken(true);
    } else {
      setValidToken(false);
      addToast({
        type: 'error',
        title: 'Invalid reset link',
        message: 'This link is invalid or has expired',
      });
    }
  }, [addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(password);

      addToast({
        type: 'success',
        title: 'Password updated',
        message: 'Your password has been reset successfully',
      });

      // Redirect to login after successful reset
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password');
      addToast({
        type: 'error',
        title: 'Reset failed',
        message: error.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  if (validToken === false) {
    return (
      <Container size="narrow" className="min-h-screen flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Invalid reset link</h1>
              <p className="text-white/60 mb-6">
                This password reset link is invalid or has expired.
              </p>
              <Button className="w-full" onClick={() => navigate('/forgot-password')}>
                Request new reset link
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container size="narrow" className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Reset password</h1>
            <p className="text-white/60">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white/80">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </Container>
  );
}
