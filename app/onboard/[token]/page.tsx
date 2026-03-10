'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Card, CardContent, Typography, Box, Avatar, Chip, 
  Button, Stepper, Step, StepLabel, Alert, CircularProgress,
  Stack, Divider, Paper
} from '@mui/material';
import { 
  WorkHistory, Schedule, CheckCircle, ArrowForward 
} from '@mui/icons-material';
import AvailabilityForm from '@/components/AvailabilityForm';

interface Position {
  id: string;
  companyName: string;
  companyLogo: string | null;
  title: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
}

interface Lead {
  id: string;
  token: string;
  firstName: string;
  lastName: string;
  email: string;
  positions: Position[];
  availability: any;
  isOnboarded: boolean;
}

const STEPS = ['Review Profile', 'Availability', 'Confirm'];

export default function OnboardPage() {
  const params = useParams();
  const token = params?.token as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) {
      fetchLead();
    }
  }, [token]);

  const fetchLead = async () => {
    try {
      const response = await fetch(`/api/enrich?token=${token}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lead not found');
      }
      
      setLead(data.lead);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityNext = async (availability: any) => {
    setSaving(true);
    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, availability }),
      });

      if (!response.ok) {
        throw new Error('Failed to save availability');
      }

      setActiveStep(2); // Move to confirmation
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography color="text.secondary">
          This link may be invalid or expired.
        </Typography>
      </Box>
    );
  }

  if (!lead) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Alert severity="warning">Lead not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 700, mx: 'auto' }}>
        
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome, {lead.firstName}!
          </Typography>
          <Typography color="text.secondary">
            Review your profile and set your availability
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Review Profile */}
        {activeStep === 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <WorkHistory sx={{ mr: 1, verticalAlign: 'middle' }} />
                Your Work History
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                We've enriched your profile with your LinkedIn data. Is this correct?
              </Typography>

              <Stack spacing={2}>
                {lead.positions.map((pos) => (
                  <Paper key={pos.id} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      src={pos.companyLogo || undefined} 
                      variant="rounded"
                      sx={{ width: 48, height: 48, bgcolor: '#f5f5f5' }}
                    >
                      {pos.companyName[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight="bold">{pos.title}</Typography>
                      <Typography color="text.secondary">{pos.companyName}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">
                        {pos.startDate} — {pos.endDate}
                      </Typography>
                      {pos.isCurrent && <Chip size="small" label="Current" color="primary" />}
                    </Box>
                  </Paper>
                ))}
              </Stack>

              {lead.positions.length === 0 && (
                <Alert severity="info">No work history found for this profile</Alert>
              )}

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  onClick={() => setActiveStep(1)}
                  endIcon={<ArrowForward />}
                >
                  Continue to Availability
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Availability */}
        {activeStep === 1 && (
          <AvailabilityForm
            initialData={lead.availability}
            onNext={handleAvailabilityNext}
          />
        )}

        {/* Step 3: Confirmation */}
        {activeStep === 2 && (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              You're All Set!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your profile and availability have been saved.
            </Typography>
            <Alert severity="success">
              We'll be in touch at {lead.email} soon!
            </Alert>
          </Card>
        )}

      </Box>
    </Box>
  );
}
