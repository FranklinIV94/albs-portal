'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, Chip, Stack, Button, CircularProgress, Alert, TextField, InputAdornment, IconButton } from '@mui/material';
import ChatPanel from '@/components/ChatPanel';
import UploadPanel from '@/components/UploadPanel';
import ProgressTracker from '@/components/ProgressTracker';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';

const themeStyles = {
  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
  cardBg: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(255,255,255,0.12)',
  textPrimary: '#f0f0f8',
  textMuted: '#94a3b8',
  accentPurple: 'rgba(139,92,246,0.3)',
};

interface Service {
  id: string;
  name: string;
  priceDisplay: string;
  icon: string;
  category: string;
}

export default function ClientPortal() {
  const { token } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // PIN verification state
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinVerified, setPinVerified] = useState(false);

  // First, fetch lead to check if PIN is set up
  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await fetch(`/api/client/${token}`);
        const data = await res.json();
        
        if (!data.success) {
          setError(data.error || 'Invalid access link');
          setLoading(false);
          return;
        }
        
        // Check if client has access
        if (!data.lead.onboardingCompleted && data.lead.status !== 'ACTIVE') {
          router.push(`/onboard/${token}`);
          return;
        }
        
        setLead(data.lead);
        setServices(data.services || []);
      } catch (err) {
        setError('Failed to load account');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchLead();
  }, [token, router]);

  const handleVerifyPin = async () => {
    if (!pin || pin.length !== 6) {
      setPinError('Please enter your 6-digit PIN');
      return;
    }

    setVerifying(true);
    setPinError('');

    try {
      const res = await fetch('/api/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lead.email, pin }),
      });

      const data = await res.json();

      if (!data.success) {
        setPinError(data.error || 'Invalid PIN');
        setPin('');
      } else {
        // PIN verified - show portal
        setPinVerified(true);
      }
    } catch (err) {
      setPinError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // PIN Entry Screen
  if (lead && !pinVerified) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: themeStyles.background,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4,
        px: 2
      }}>
        <Card sx={{ 
          bgcolor: themeStyles.cardBg, 
          border: `1px solid ${themeStyles.cardBorder}`, 
          borderRadius: 4,
          p: 4,
          maxWidth: 400,
          width: '100%'
        }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Lock sx={{ fontSize: 60, color: '#a78bfa', mb: 1 }} />
          </Box>
          
          <Typography variant="h5" fontWeight="bold" sx={{ color: themeStyles.textPrimary, mb: 1, textAlign: 'center' }}>
            Welcome Back
          </Typography>
          <Typography sx={{ color: themeStyles.textMuted, mb: 4, textAlign: 'center' }}>
            Enter your PIN to access your portal
          </Typography>

          {pinError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {pinError}
            </Alert>
          )}

          <TextField
            label="Portal PIN"
            type={showPin ? 'text' : 'password'}
            fullWidth
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPin(val);
              setPinError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
            inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
            placeholder="Enter 6-digit PIN"
            sx={{ mb: 3, 
              '& .MuiInputLabel-root': { color: themeStyles.textMuted }, 
              '& .MuiInputLabel-root.Mui-focused': { color: '#a78bfa' },
              '& .MuiOutlinedInput-root': { color: '#fff' },
              '& .MuiOutlinedInput-input': { color: '#fff', caretColor: '#fff' },
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock sx={{ color: themeStyles.textMuted }} /></InputAdornment>,
              endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPin(!showPin)} edge="end">{showPin ? <VisibilityOff sx={{ color: themeStyles.textMuted }} /> : <Visibility sx={{ color: themeStyles.textMuted }} />}</IconButton></InputAdornment>,
            }}
          />

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleVerifyPin}
            disabled={verifying || pin.length !== 6}
            sx={{
              background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
              color: '#fff',
              py: 1.5,
              borderRadius: 2,
              fontWeight: 'bold',
              '&:hover': { background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)' },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {verifying ? <CircularProgress size={24} color="inherit" /> : 'Access Portal'}
          </Button>

          <Typography variant="body2" sx={{ color: '#64748b', mt: 4, textAlign: 'center' }}>
            Forgot your PIN? <a href="mailto:support@simplifyingbusinesses.com" style={{ color: '#a78bfa' }}>Contact support</a>
          </Typography>
        </Card>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: themeStyles.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#8b5cf6' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: themeStyles.background, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, p: 4, maxWidth: 400, textAlign: 'center' }}>
          <Typography sx={{ color: '#ef4444', fontSize: 24, fontWeight: 'bold', mb: 2 }}>Access Denied</Typography>
          <Typography sx={{ color: themeStyles.textMuted }}>{error}</Typography>
        </Card>
      </Box>
    );
  }

  const selectedServices = lead?.leadServices?.map((ls: any) => ls.serviceId) || [];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: themeStyles.background, position: 'relative', py: 8 }}>
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 600, mx: 'auto', px: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography sx={{ 
            fontSize: 36, fontWeight: 'bold', mb: 2,
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa, #f472b6)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Welcome back, {lead?.firstName}!
          </Typography>
          <Typography sx={{ color: themeStyles.textMuted, fontSize: 18 }}>
            Your portal is active. Track your progress and communicate with us below.
          </Typography>
        </Box>

        {/* Progress Tracker */}
        <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, mb: 3 }}>
          <CardContent>
            <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold', mb: 2 }}>
              📊 Project Progress
            </Typography>
            <ProgressTracker token={token as string} compact />
          </CardContent>
        </Card>

        {/* Selected Services */}
        {selectedServices.length > 0 && (
          <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, mb: 3 }}>
            <CardContent>
              <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold', mb: 2 }}>
                📋 Your Services
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {selectedServices.map((id: string) => {
                  const s = services.find((x: Service) => x.id === id);
                  return s ? (
                    <Chip 
                      key={id} 
                      label={`${s.icon} ${s.name} - ${s.priceDisplay}`} 
                      sx={{ bgcolor: themeStyles.accentPurple, color: themeStyles.textPrimary }} 
                    />
                  ) : null;
                })}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Chat Panel */}
        <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <ChatPanel token={token as string} />
          </Box>
        </Card>

        {/* Document Upload */}
        <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <UploadPanel token={token as string} />
          </Box>
        </Card>

        <Alert sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', mb: 3 }}>
          💬 Need to make changes? Use the chat above to request updates to your services or ask questions.
        </Alert>

        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" gap={2}>
          {lead?.onboardingCompleted && (
            <Button variant="contained" href={`https://vercel-app-sooty-nu.vercel.app/book/${token}`}
              sx={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', px: 4, py: 1.5, borderRadius: 3, fontWeight: 'bold' }}>
              📅 Book a Consultation
            </Button>
          )}
          <Button variant="contained" href="/calendar"
            sx={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', px: 4, py: 1.5, borderRadius: 3, fontWeight: 'bold' }}>
            📅 Book a Meeting
          </Button>
          <Button variant="contained" href="mailto:support@simplifyingbusinesses.com"
            sx={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1)', color: '#fff', px: 4, py: 1.5, borderRadius: 3, fontWeight: 'bold' }}>
            Contact Support
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}