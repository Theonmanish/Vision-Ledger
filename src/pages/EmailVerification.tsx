import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { GlassCard } from '../components/ui/glass-card';
import { Container } from '../components/ui/container';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const handleVerification = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (type !== 'signup' || !token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        await verifyEmail(token);

        setStatus('success');
        setMessage('Your email has been verified successfully!');
        addToast({
          type: 'success',
          title: 'Email verified',
          message: 'You can now sign in to your account',
        });
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to verify email');
        addToast({
          type: 'error',
          title: 'Verification failed',
          message: error.message || 'Please try again',
        });
      }
    };

    handleVerification();
  }, [searchParams, addToast, verifyEmail]);

  if (status === 'loading') {
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
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <div className="h-8 w-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Verifying your email</h1>
              <p className="text-white/60">Please wait while we verify your email address...</p>
            </div>
          </GlassCard>
        </motion.div>
      </Container>
    );
  }

  if (status === 'success') {
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
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Email verified!</h1>
              <p className="text-white/60 mb-6">{message}</p>
              <Button className="w-full" onClick={() => navigate('/login')}>
                Continue to login
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
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Verification failed</h1>
            <p className="text-white/60 mb-6">{message}</p>
            <div className="space-y-3">
              <Button className="w-full" onClick={() => navigate('/signup')}>
                <Mail className="h-4 w-4 mr-2" />
                Sign up again
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                Back to login
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </Container>
  );
}
