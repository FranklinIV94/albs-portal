'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, LinearProgress, Chip, Stack, Card, CardContent,
  Stepper, Step, StepLabel, StepContent, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  CheckCircle, RadioButtonUnchecked, ExpandMore,
  Person, EventNote, Description, Payment, PlayArrow
} from '@mui/icons-material';

interface ProgressData {
  status: string;
  completedSteps: string[];
  currentStep: string;
  milestones?: { title: string; status: string; completedAt?: string }[];
}

interface ProgressTrackerProps {
  leadId?: string;
  token?: string;
  compact?: boolean;
}

const STEPS_CONFIG = [
  { key: 'welcome', label: 'Welcome & Profile', icon: Person },
  { key: 'services', label: 'Service Selection', icon: EventNote },
  { key: 'availability', label: 'Availability', icon: EventNote },
  { key: 'contract', label: 'Contract Signing', icon: Description },
  { key: 'work_in_progress', label: 'Work in Progress', icon: PlayArrow },
  { key: 'payment', label: 'Payment', icon: Payment },
  { key: 'complete', label: 'Complete', icon: CheckCircle },
];

// Theme colors for dark mode
const darkTheme = {
  textPrimary: 'rgb(240,240,248)',
  textMuted: 'rgba(240,240,248,0.6)',
};

export default function ProgressTracker({ leadId, token, compact = false }: ProgressTrackerProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (leadId || token) {
      fetchProgress();
    }
  }, [leadId, token]);

  const fetchProgress = async () => {
    try {
      const query = leadId ? `leadId=${leadId}` : `token=${token}`;
      const res = await fetch(`/api/progress?${query}`);
      const data = await res.json();
      
      // Handle error responses gracefully
      if (!res.ok || data.error) {
        const errorMsg = data.error || `Error: ${res.status} ${res.statusText}`;
        console.error('Progress API error:', errorMsg);
        setError(errorMsg);
        setProgress(null);
        return;
      }
      
      // API returns data directly at top level
      setError(null);
      setProgress(data);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      setError('Failed to load progress data');
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ p: 2 }}><LinearProgress /></Box>;
  }

  if (error) {
    return (
      <Typography sx={{ p: 2, color: darkTheme.textMuted }}>
        {error}
      </Typography>
    );
  }

  if (!progress) {
    return <Typography sx={{ color: darkTheme.textMuted }}>No progress data available</Typography>;
  }

  const currentStepIndex = STEPS_CONFIG.findIndex(s => s.key === progress.currentStep);
  const completedCount = progress.completedSteps.length;
  const totalSteps = STEPS_CONFIG.length;
  const percentage = Math.round((completedCount / totalSteps) * 100);

  if (compact) {
    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ color: darkTheme.textPrimary }}>
            {percentage}% Complete
          </Typography>
          <Chip 
            label={progress.status} 
            size="small" 
            color={progress.status === 'ACTIVE' ? 'success' : 'primary'}
          />
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={percentage} 
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: darkTheme.textMuted }}>
          Current: {STEPS_CONFIG[currentStepIndex]?.label || 'Unknown'}
        </Typography>
      </Box>
    );
  }

  return (
    <Card variant="outlined" sx={{ mb: 3, bgcolor: 'transparent', borderColor: 'rgba(255,255,255,0.08)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: darkTheme.textPrimary }}>
            Onboarding Progress
          </Typography>
          <Chip 
            label={progress.status} 
            color={progress.status === 'ACTIVE' ? 'success' : 'primary'}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: darkTheme.textMuted }}>
              {completedCount} of {totalSteps} steps completed
            </Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ color: darkTheme.textPrimary }}>
              {percentage}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={percentage} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        <Stepper activeStep={currentStepIndex} orientation="vertical">
          {STEPS_CONFIG.map((step, index) => {
            const isCompleted = progress.completedSteps.includes(step.key);
            const isCurrent = step.key === progress.currentStep;
            const StepIcon = isCompleted ? CheckCircle : isCurrent ? PlayArrow : RadioButtonUnchecked;

            return (
              <Step key={step.key} completed={isCompleted}>
                <StepLabel
                  StepIconComponent={() => (
                    <StepIcon 
                      color={isCompleted ? 'success' : isCurrent ? 'primary' : 'disabled'} 
                    />
                  )}
                >
                  <Typography 
                    fontWeight={isCurrent ? 'bold' : 'regular'}
                    sx={{ color: isCompleted || isCurrent ? darkTheme.textPrimary : darkTheme.textMuted }}
                  >
                    {step.label}
                  </Typography>
                </StepLabel>
                <StepContent>
                  {isCurrent && (
                    <Typography variant="body2" sx={{ color: '#818cf8' }}>
                      Currently on this step
                    </Typography>
                  )}
                </StepContent>
              </Step>
            );
          })}
        </Stepper>

        {progress.milestones && progress.milestones.length > 0 && (
          <Accordion sx={{ mt: 2, bgcolor: 'transparent', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: darkTheme.textMuted }} />}>
              <Typography fontWeight="bold" sx={{ color: darkTheme.textPrimary }}>Project Milestones</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                {progress.milestones.map((m, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {m.status === 'complete' ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : (
                      <RadioButtonUnchecked color="disabled" fontSize="small" />
                    )}
                    <Typography variant="body2" sx={{ color: darkTheme.textPrimary }}>{m.title}</Typography>
                    {m.completedAt && (
                      <Typography variant="caption" sx={{ color: darkTheme.textMuted }}>
                        - {new Date(m.completedAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}