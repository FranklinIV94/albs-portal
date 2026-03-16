'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Card, CardContent, TextField, Button, Typography, Alert, InputAdornment, IconButton } from '@mui/material';
import { Lock, Visibility, VisibilityOff, Person } from '@mui/icons-material';

export default function ClientLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !pin) {
      setError('Please enter both email and PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });

      const data = await res.json();

      if (data.success && data.lead?.token) {
        router.push(`/client/${data.lead.token}`);
      } else {
        setError(data.error || 'Invalid email or PIN');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      py: 4,
      px: 2
    }}>
      <Container maxWidth="sm">
        <Card sx={{ 
          bgcolor: 'rgba(255,255,255,0.08)', 
          border: '1px solid rgba(255,255,255,0.12)', 
          borderRadius: 4,
          animation: 'fadeInUp 0.5s ease-out',
          '@keyframes fadeInUp': {
            from: { opacity: 0, transform: 'translateY(30px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          }
        }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <Lock sx={{ fontSize: 60, color: '#a78bfa', mb: 1 }} />
            </Box>
            
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#f0f0f8', mb: 1 }}>
              Client Portal
            </Typography>
            <Typography sx={{ color: '#94a3b8', mb: 4 }}>
              Enter your credentials to access your account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f0f0f8',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: '#a78bfa' },
                    '&.Mui-focused fieldset': { borderColor: '#a78bfa' },
                  },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />

              <TextField
                label="Portal PIN"
                type={showPin ? 'text' : 'password'}
                fullWidth
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPin(val);
                }}
                inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
                placeholder="Enter 6-digit PIN"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPin(!showPin)} edge="end">
                        {showPin ? <VisibilityOff sx={{ color: '#94a3b8' }} /> : <Visibility sx={{ color: '#94a3b8' }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f0f0f8',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: '#a78bfa' },
                    '&.Mui-focused fieldset': { borderColor: '#a78bfa' },
                  },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                }}
              />

              <Button
                variant="contained"
                size="large"
                onClick={handleLogin}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #a78bfa, #6366f1)',
                  color: '#fff',
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  fontSize: 16,
                  mt: 2,
                  '&:hover': { background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)' },
                  '&:disabled': { opacity: 0.5 },
                }}
              >
                {loading ? 'Verifying...' : 'Access Portal'}
              </Button>
            </Box>

            <Typography variant="body2" sx={{ color: '#64748b', mt: 4 }}>
              Don't have a PIN?{' '}
              <a href="/onboard" style={{ color: '#a78bfa' }}>
                Start onboarding
              </a>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}