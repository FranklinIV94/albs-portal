'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, Chip, Stack, Button, CircularProgress, Alert } from '@mui/material';
import ChatPanel from '@/components/ChatPanel';
import ProgressTracker from '@/components/ProgressTracker';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/client/${token}`);
        const data = await res.json();
        
        if (!data.success) {
          setError(data.error || 'Invalid access link');
          setLoading(false);
          return;
        }
        
        // Check if client has access (onboarding completed or active)
        if (!data.lead.onboardingCompleted && data.lead.status !== 'ACTIVE') {
          // Redirect to onboarding
          router.push(`/onboard/${token}`);
          return;
        }
        
        setLead(data.lead);
        setServices(data.services || []);
      } catch (err) {
        setError('Failed to load portal');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) fetchData();
  }, [token, router]);

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
      {/* Animated background */}
      <Box sx={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: themeStyles.background,
        '&::before': {
          content: '""', position: 'absolute', top: '10%', left: '20%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite',
        },
        '@keyframes pulse': { '0%, 100%': { opacity: 0.5, transform: 'scale(1)' }, '50%': { opacity: 0.8, transform: 'scale(1.1)' } },
      }} />
      
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
          <ChatPanel token={token as string} />
        </Card>

        <Alert sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', mb: 3 }}>
          💬 Need to make changes? Use the chat above to request updates to your services or ask questions.
        </Alert>

        <Button variant="contained" href="mailto:support@simplifyingbusinesses.com"
          sx={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1)', color: '#fff', px: 4, py: 1.5, borderRadius: 3, fontWeight: 'bold' }}>
          Contact Support
        </Button>
      </Box>
    </Box>
  );
}