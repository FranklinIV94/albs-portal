'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Card, CardContent, Typography, Box, TextField, Button,
  Stepper, Step, StepLabel, Checkbox, FormControlLabel,
  Paper, Stack, Alert, CircularProgress, Chip, Divider
} from '@mui/material';
import { 
  CheckCircle, ArrowForward, ArrowBack, CreditCard, 
  Business, Schedule, Description, Autorenew
} from '@mui/icons-material';
import ProgressTracker from '@/components/ProgressTracker';
import ChatPanel from '@/components/ChatPanel';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  priceDisplay: string;
  icon: string;
}

interface Lead {
  id: string;
  token: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  company: string | null;
  status: string;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
  leadServices?: { service: Service }[];
}

const STEPS = ['Welcome', 'Services', 'Availability', 'Terms', 'Payment', 'Confirmation'];

const CATEGORIES: Record<string, string> = {
  AI_SERVICES: '🤖 AI Services',
  TAX_BUSINESS: '📋 Tax & Business',
  PAYROLL: '💰 Payroll Setup',
  PAYROLL_BOOKKEEPING: '💼 Payroll & Bookkeeping',
  BOOKKEEPING: '📒 Bookkeeping',
  MARKETING: '📣 Marketing',
};

const themeStyles = {
  background: 'rgb(10, 14, 26)',
  cardBg: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  textPrimary: 'rgb(240,240,248)',
  textMuted: 'rgba(240,240,248,0.6)',
  accentPurple: 'rgba(107,79,187,0.2)',
  accentViolet: 'rgba(139,92,246,0.15)',
  accentBlue: 'rgba(59,130,246,0.15)',
};

export default function OnboardPage() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = params.token;

  const [lead, setLead] = useState<Lead | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isConfirmed = searchParams.get('step') === 'confirmation';

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', company: '', title: '', phone: '',
    notes: '', signature: '',
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [availability, setAvailability] = useState({
    monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
    morning: true, afternoon: true, evening: false,
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [billingType, setBillingType] = useState<'ONE_TIME' | 'MONTHLY' | 'YEARLY'>('ONE_TIME');
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { fetchLead(); }, [token]);
  useEffect(() => { 
    if (isConfirmed) setActiveStep(5); 
  }, [isConfirmed]);

  // Restore progress from database - skip to completed steps
  useEffect(() => {
    if (lead && !isConfirmed) {
      // If onboarding is complete, show confirmation/messaging view
      if (lead.onboardingCompleted || lead.status === 'ACTIVE') {
        setActiveStep(5);
        return;
      }
      
      // Otherwise, restore to saved step (0-4)
      const savedStep = lead.onboardingStep ?? 0;
      if (savedStep > 0 && savedStep < 5) {
        setActiveStep(savedStep);
      }
    }
  }, [lead, isConfirmed]);

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/onboard/${token}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLead(data.lead);
      setServices(data.services);
      if (data.lead) {
        setFormData(prev => ({
          ...prev,
          firstName: data.lead.firstName || '',
          lastName: data.lead.lastName || '',
          email: data.lead.email || '',
          company: data.lead.company || '',
          title: data.lead.title || '',
          phone: data.lead.phone || '',
          notes: data.lead.notes || '',
        }));
        if (data.lead.leadServices) {
          setSelectedServices(data.lead.leadServices.map((s: any) => s.service.id));
        }
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleNext = async () => {
    setSaving(true);
    setStripeError(null);
    try {
      if (activeStep === 0) {
        await fetch(`/api/onboard/${token}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, onboardingStep: 1 }),
        });
      } else if (activeStep === 1) {
        await fetch(`/api/onboard/${token}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceIds: selectedServices, notes: formData.notes, onboardingStep: 2 }),
        });
      } else if (activeStep === 2) {
        await fetch(`/api/onboard/${token}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ availability, onboardingStep: 3 }),
        });
      } else if (activeStep === 3) {
        await fetch(`/api/onboard/${token}/complete`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signatureName: formData.signature, ipAddress: '0.0.0.0' }),
        });
      }
      setActiveStep(prev => prev + 1);
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getTotal = () => selectedServices.reduce((sum, id) => {
    const s = services.find(x => x.id === id);
    if (!s) return sum;
    return sum + parseInt(s.priceDisplay.replace(/[$,]/g, '').split('-')[0]) || 0;
  }, 0);

  if (loading || !mounted) return (
    <Box sx={{ minHeight: '100vh', bgcolor: themeStyles.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress sx={{ color: '#a78bfa' }} />
    </Box>
  );

  if (error) return (
    <Box sx={{ minHeight: '100vh', bgcolor: themeStyles.background, p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Alert sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</Alert>
    </Box>
  );

  // Starfield background
  const StarField = () => (
    <Box sx={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
      background: themeStyles.background,
    }}>
      {[...Array(80)].map((_, i) => (
        <Box key={i} sx={{
          position: 'absolute',
          width: Math.random() * 2 + 1,
          height: Math.random() * 2 + 1,
          borderRadius: '50%',
          background: Math.random() > 0.7 ? '#a78bfa' : '#fff',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity: Math.random() * 0.8 + 0.2,
          animation: `twinkle ${Math.random() * 4 + 3}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 2}s`,
          '@keyframes twinkle': {
            '0%, 100%': { opacity: 0.2, transform: 'scale(1)' },
            '50%': { opacity: 1, transform: 'scale(1.2)' },
          },
        }} />
      ))}
    </Box>
  );

  // Confirmation
  if (activeStep === 5) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: themeStyles.background, position: 'relative', py: 8 }}>
        <StarField />
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 600, mx: 'auto', px: 3, textAlign: 'center', animation: 'fadeInUp 0.6s ease-out',
          '@keyframes fadeInUp': { from: { opacity: 0, transform: 'translateY(30px)' }, to: { opacity: 1, transform: 'translateY(0)' } }
        }}>
          <Typography sx={{ fontSize: 64, mb: 2 }}>🎉</Typography>
          <Typography sx={{
            fontSize: 36, fontWeight: 'bold', mb: 2,
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa, #f472b6)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Welcome to Simplifying Businesses!
          </Typography>
          <Typography sx={{ color: themeStyles.textMuted, mb: 4, fontSize: 18 }}>
            Your onboarding is complete. We're excited to work with you!
          </Typography>
          
          <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, mb: 3, textAlign: 'left' }}>
            <CardContent>
              <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold', mb: 2 }}>Selected Services:</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {selectedServices.map(id => {
                  const s = services.find(x => x.id === id);
                  return s ? <Chip key={id} label={`${s.icon} ${s.name} - ${s.priceDisplay}`} sx={{ bgcolor: themeStyles.accentPurple, color: themeStyles.textPrimary }} /> : null;
                })}
              </Stack>
            </CardContent>
          </Card>

          <Alert sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', mb: 3 }}>
            A confirmation email has been sent. We'll be in touch within 24 hours!
          </Alert>

          {/* Chat Panel for client communication */}
          {lead && (
            <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, mb: 3, maxHeight: 400 }}>
              <ChatPanel token={token as string} />
            </Card>
          )}

          <Button variant="contained" href="mailto:support@simplifyingbusinesses.com"
            sx={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1)', color: '#fff', px: 4, py: 1.5, borderRadius: 3, fontWeight: 'bold' }}>
            Contact Support
          </Button>
        </Box>
      </Box>
    );
  }

  const groupedServices = services.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: themeStyles.background, position: 'relative', py: 6 }}>
      <StarField />
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 800, mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography sx={{
            fontSize: 32, fontWeight: 'bold', mb: 1,
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa, #f472b6)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Simplifying Businesses
          </Typography>
          <Typography sx={{ color: themeStyles.textMuted }}>Client Onboarding Portal</Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ 
          mb: 4, '& .MuiStepLabel-label': { color: themeStyles.textMuted },
          '& .Mui-active .MuiStepLabel-label': { color: '#a78bfa' },
          '& .Mui-completed .MuiStepLabel-label': { color: '#22c55e' },
        }} alternativeLabel>
          {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>

        {/* Progress Tracker - Client View */}
        {lead && (
          <Box sx={{ mb: 3 }}>
            <ProgressTracker token={token as string} compact />
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Welcome */}
        {activeStep === 0 && (
          <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, animation: 'fadeInUp 0.5s ease-out',
            '@keyframes fadeInUp': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } }
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 'bold', color: themeStyles.textPrimary, mb: 3 }}>
                Welcome! Let's get started.
              </Typography>
              <Typography sx={{ color: themeStyles.textMuted, mb: 3 }}>
                Fill in your information so we can tailor our services to your needs.
              </Typography>
              <Stack spacing={2.5}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="First Name" fullWidth required value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    sx={{ '& .MuiOutlinedInput-root': { color: themeStyles.textPrimary, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#a78bfa' } }, '& .MuiInputLabel-root': { color: themeStyles.textMuted } }} />
                  <TextField label="Last Name" fullWidth required value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    sx={{ '& .MuiOutlinedInput-root': { color: themeStyles.textPrimary, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#a78bfa' } }, '& .MuiInputLabel-root': { color: themeStyles.textMuted } }} />
                </Box>
                <TextField label="Email" fullWidth type="email" required value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  sx={{ '& .MuiOutlinedInput-root': { color: themeStyles.textPrimary, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#a78bfa' } }, '& .MuiInputLabel-root': { color: themeStyles.textMuted } }} />
                <TextField label="Company" fullWidth value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                  sx={{ '& .MuiOutlinedInput-root': { color: themeStyles.textPrimary, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#a78bfa' } }, '& .MuiInputLabel-root': { color: themeStyles.textMuted } }} />
                <TextField label="Job Title" fullWidth value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  sx={{ '& .MuiOutlinedInput-root': { color: themeStyles.textPrimary, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#a78bfa' } }, '& .MuiInputLabel-root': { color: themeStyles.textMuted } }} />
                <TextField label="Phone" fullWidth value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  sx={{ '& .MuiOutlinedInput-root': { color: themeStyles.textPrimary, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#a78bfa' } }, '& .MuiInputLabel-root': { color: themeStyles.textMuted } }} />
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Services */}
        {activeStep === 1 && (
          <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, animation: 'fadeInUp 0.5s ease-out' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 'bold', color: themeStyles.textPrimary, mb: 1 }}>
                Select Your Services
              </Typography>
              <Typography sx={{ color: themeStyles.textMuted, mb: 3 }}>
                Choose the services you'd like us to provide.
              </Typography>
              
              {Object.entries(groupedServices).map(([cat, srvs]) => (
                <Box key={cat} sx={{ mb: 4 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 'bold', color: '#a78bfa', mb: 2 }}>
                    {CATEGORIES[cat] || cat}
                  </Typography>
                  <Stack spacing={1.5}>
                    {srvs.map(service => (
                      <Paper key={service.id} onClick={() => toggleService(service.id)}
                        sx={{ p: 2.5, cursor: 'pointer', borderRadius: 3, border: `1px solid ${selectedServices.includes(service.id) ? '#a78bfa' : themeStyles.cardBorder}`,
                          bgcolor: selectedServices.includes(service.id) ? themeStyles.accentPurple : 'transparent',
                          transition: 'all 0.2s', '&:hover': { borderColor: '#a78bfa', bgcolor: themeStyles.accentPurple }
                        }}>
                        <FormControlLabel control={<Checkbox checked={selectedServices.includes(service.id)} sx={{ color: themeStyles.textMuted, '&.Mui-checked': { color: '#a78bfa' } }} />}
                          label={<Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontWeight: 'bold', color: themeStyles.textPrimary }}>
                                {service.icon} {service.name}
                              </Typography>
                              <Chip label={service.priceDisplay} size="small" sx={{ bgcolor: themeStyles.accentBlue, color: '#60a5fa' }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: themeStyles.textMuted, mt: 0.5 }}>{service.description}</Typography>
                          </Box>}
                          sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                        />
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              ))}

              <TextField label="Additional Notes" multiline rows={2} fullWidth value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                sx={{ mt: 3, '& .MuiOutlinedInput-root': { color: themeStyles.textPrimary, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }, '& .MuiInputLabel-root': { color: themeStyles.textMuted } }} />
            </CardContent>
          </Card>
        )}

        {/* Availability */}
        {activeStep === 2 && (
          <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, animation: 'fadeInUp 0.5s ease-out' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 'bold', color: themeStyles.textPrimary, mb: 1 }}>
                Your Availability
              </Typography>
              <Typography sx={{ color: themeStyles.textMuted, mb: 3 }}>
                When are you available for consultations?
              </Typography>
              
              <Typography sx={{ fontWeight: 'bold', color: themeStyles.textPrimary, mb: 1.5 }}>Days of Week</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 4, flexWrap: 'wrap' }}>
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
                  <Chip key={day} label={day.charAt(0).toUpperCase() + day.slice(1)}
                    onClick={() => setAvailability({...availability, [day]: !availability[day as keyof typeof availability]})}
                    sx={{ bgcolor: availability[day as keyof typeof availability] ? themeStyles.accentPurple : 'transparent',
                      color: themeStyles.textPrimary, border: `1px solid ${availability[day as keyof typeof availability] ? '#a78bfa' : themeStyles.cardBorder}`,
                      cursor: 'pointer', '&:hover': { borderColor: '#a78bfa' }
                    }}
                  />
                ))}
              </Box>

              <Typography sx={{ fontWeight: 'bold', color: themeStyles.textPrimary, mb: 1.5 }}>Time of Day</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[{ key: 'morning', label: '🌅 Morning' }, { key: 'afternoon', label: '☀️ Afternoon' }, { key: 'evening', label: '🌙 Evening' }].map(time => (
                  <Chip key={time.key} label={time.label}
                    onClick={() => setAvailability({...availability, [time.key]: !availability[time.key as keyof typeof availability]})}
                    sx={{ bgcolor: availability[time.key as keyof typeof availability] ? themeStyles.accentPurple : 'transparent',
                      color: themeStyles.textPrimary, border: `1px solid ${availability[time.key as keyof typeof availability] ? '#a78bfa' : themeStyles.cardBorder}`,
                      cursor: 'pointer', '&:hover': { borderColor: '#a78bfa' }
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Terms */}
        {activeStep === 3 && (
          <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, animation: 'fadeInUp 0.5s ease-out' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 'bold', color: themeStyles.textPrimary, mb: 3 }}>
                Terms & Signature
              </Typography>
              
              <Paper sx={{ p: 3, mb: 3, maxHeight: 300, overflow: 'auto', bgcolor: 'rgba(0,0,0,0.2)', border: `1px solid ${themeStyles.cardBorder}` }}>
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, color: themeStyles.textMuted }}>
{`MASTER SERVICE AGREEMENT

This Master Service Agreement (the "Agreement") is entered into as of ${new Date().toLocaleDateString()} (the "Effective Date) by and between Simplifying Businesses ("Provider") and the undersigned client ("Client").

1. SCOPE OF SERVICES
Provider agrees to perform the services selected by the Client during the onboarding process:

${selectedServices.map(id => {
  const s = services.find(x => x.id === id);
  if (!s) return '';
  const price = parseInt(s.priceDisplay.replace(/[$,]/g, '').split('-')[0]) || 0;
  return `• ${s.icon} ${s.name} - $${price} (${s.description.substring(0, 80)}...)`;
}).filter(Boolean).join('\n')}

${selectedServices.length > 0 ? `Total: $${getTotal().toLocaleString()}` : ''}

2. COMPENSATION AND PAYMENT
Fees: Client agrees to pay the fees associated with the selected services as outlined above.
Payment Schedule: 
• One-time Projects: 100% due upfront unless otherwise specified.
• Monthly Recurring Services: Fees are billed in advance on the 1st of each month.
Late Payments: Payments not received within 7 days of the due date will incur a late fee of 1.5% per month.

3. TERM AND TERMINATION
Term: This Agreement commences on the Effective Date and continues until completion of services.
Termination (Monthly Services): Either party may terminate with 30 days' written notice.
Termination for Cause: Either party may terminate immediately if the other party breaches and fails to cure within 10 days of notice.

4. CLIENT RESPONSIBILITIES
• Provide timely access to necessary accounts
• Appoint a primary point of contact for approvals
• Ensure all data provided is accurate

5. CONFIDENTIALITY & PROPRIETARY RIGHTS
Both parties agree to keep all non-public information strictly confidential.
Work Product: Upon full payment, Client shall own deliverables created specifically for them.
Provider retains ownership of pre-existing toolsets, "know-how," and generic methods.

6. LIMITATION OF LIABILITY
Provider's total liability shall not exceed the total amount paid during the three (3) months preceding any claim. Provider is not liable for indirect, incidental, or consequential damages.

7. TAX & COMPLIANCE DISCLAIMER
For Tax and Bookkeeping services, Provider relies on information provided by Client. Client is responsible for final accuracy. Provider does not provide legal advice.

8. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Colorado.

SIGNATURES

Provider: _________________________ Date: ${new Date().toLocaleDateString()}
Client:  _________________________ Date: _____________`}
                </Typography>
              </Paper>

              <FormControlLabel control={<Checkbox checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} sx={{ color: themeStyles.textMuted, '&.Mui-checked': { color: '#a78bfa' } }} />}
                label={<Typography sx={{ color: themeStyles.textMuted }}>I have read and agree to the Master Service Agreement</Typography>}
                sx={{ mb: 2 }}
              />

              <TextField label="Type your full legal name to sign" fullWidth value={formData.signature}
                onChange={e => setFormData({...formData, signature: e.target.value})}
                disabled={!agreedToTerms}
                sx={{ '& .MuiOutlinedInput-root': { color: themeStyles.textPrimary, '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&.Mui-focused fieldset': { borderColor: '#a78bfa' } }, '& .MuiInputLabel-root': { color: themeStyles.textMuted } }} />
            </CardContent>
          </Card>
        )}

        {/* Payment */}
        {activeStep === 4 && (
          <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, animation: 'fadeInUp 0.5s ease-out', textAlign: 'center', p: 4 }}>
            <CardContent>
              <CreditCard sx={{ fontSize: 60, color: '#a78bfa', mb: 2 }} />
              <Typography sx={{ fontSize: 24, fontWeight: 'bold', color: themeStyles.textPrimary, mb: 1 }}>
                Complete Your Payment
              </Typography>
              <Typography sx={{ color: themeStyles.textMuted, mb: 3 }}>
                Secure payment powered by Stripe
              </Typography>

              {/* Payment error message */}
              {stripeError && (
                <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography variant="body2">
                    <strong>Payment unavailable:</strong> {stripeError}.{' '}
                    Please contact us at{' '}
                    <a href="mailto:support@simplifyingbusinesses.com" style={{ color: '#2563eb' }}>
                      support@simplifyingbusinesses.com
                    </a>
                  </Typography>
                </Alert>
              )}

              {/* Billing Type Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ color: themeStyles.textMuted, mb: 2, fontWeight: 'bold' }}>
                  Select Billing Option:
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant={billingType === 'ONE_TIME' ? 'contained' : 'outlined'}
                    onClick={() => setBillingType('ONE_TIME')}
                    sx={{ 
                      borderColor: 'rgba(255,255,255,0.2)', 
                      color: billingType === 'ONE_TIME' ? '#fff' : themeStyles.textMuted,
                      background: billingType === 'ONE_TIME' ? 'linear-gradient(135deg, #a78bfa, #6366f1)' : 'transparent',
                      '&:hover': { borderColor: '#a78bfa' }
                    }}
                  >
                    One-Time Payment
                  </Button>
                  <Button
                    variant={billingType === 'MONTHLY' ? 'contained' : 'outlined'}
                    onClick={() => setBillingType('MONTHLY')}
                    sx={{ 
                      borderColor: 'rgba(255,255,255,0.2)', 
                      color: billingType === 'MONTHLY' ? '#fff' : themeStyles.textMuted,
                      background: billingType === 'MONTHLY' ? 'linear-gradient(135deg, #a78bfa, #6366f1)' : 'transparent',
                      '&:hover': { borderColor: '#a78bfa' }
                    }}
                  >
                    <Autorenew sx={{ mr: 1 }} /> Monthly
                  </Button>
                  <Button
                    variant={billingType === 'YEARLY' ? 'contained' : 'outlined'}
                    onClick={() => setBillingType('YEARLY')}
                    sx={{ 
                      borderColor: 'rgba(255,255,255,0.2)', 
                      color: billingType === 'YEARLY' ? '#fff' : themeStyles.textMuted,
                      background: billingType === 'YEARLY' ? 'linear-gradient(135deg, #a78bfa, #6366f1)' : 'transparent',
                      '&:hover': { borderColor: '#a78bfa' }
                    }}
                  >
                    <Autorenew sx={{ mr: 1 }} /> Yearly (Save 10%)
                  </Button>
                </Stack>
              </Box>

              <Paper sx={{ p: 3, mb: 3, textAlign: 'left', bgcolor: 'rgba(0,0,0,0.2)', border: `1px solid ${themeStyles.cardBorder}` }}>
                <Typography sx={{ fontWeight: 'bold', color: themeStyles.textPrimary, mb: 2 }}>Order Summary:</Typography>
                {selectedServices.map(id => {
                  const s = services.find(x => x.id === id);
                  if (!s) return null;
                  const price = parseInt(s.priceDisplay.replace(/[$,]/g, '').split('-')[0]) || 0;
                  const displayPrice = billingType === 'YEARLY' 
                    ? `$${(price * 12 * 0.9).toLocaleString()}/yr`
                    : billingType === 'MONTHLY'
                    ? `$${price}/mo`
                    : s.priceDisplay;
                  return (
                    <Box key={id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: themeStyles.textMuted }}>{s.icon} {s.name}</Typography>
                      <Typography sx={{ fontWeight: 'bold', color: themeStyles.textPrimary }}>{displayPrice}</Typography>
                    </Box>
                  );
                })}
                <Divider sx={{ my: 2, borderColor: themeStyles.cardBorder }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 'bold', color: themeStyles.textPrimary }}>
                    {billingType === 'ONE_TIME' ? 'Total:' : billingType === 'MONTHLY' ? 'Monthly Total:' : 'Yearly Total (10% off):'}
                  </Typography>
                  <Typography sx={{ fontWeight: 'bold', color: '#a78bfa', fontSize: 20 }}>
                    ${billingType === 'YEARLY' 
                      ? Math.round(getTotal() * 12 * 0.9).toLocaleString()
                      : billingType === 'MONTHLY'
                      ? getTotal().toLocaleString()
                      : getTotal().toLocaleString()
                    }
                    {billingType !== 'ONE_TIME' && <sup>/{billingType === 'MONTHLY' ? 'mo' : 'yr'}</sup>}
                  </Typography>
                </Box>
              </Paper>

              <Button 
                variant="contained" 
                size="large" 
                onClick={async () => {
                  if (!lead) return;
                  setSaving(true);
                  setStripeError(null);
                  try {
                    // Use subscription API for recurring billing
                    const endpoint = billingType === 'ONE_TIME' 
                      ? '/api/stripe/checkout' 
                      : '/api/stripe/subscription';
                    
                    const res = await fetch(endpoint, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        leadId: lead.id,
                        interval: billingType === 'YEARLY' ? 'YEARLY' : 'MONTHLY'
                      }),
                    });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      setStripeError(data.error || 'Payment processing is temporarily unavailable. Please try again or contact support.');
                    }
                  } catch (err: any) {
                    setStripeError('Payment processing is temporarily unavailable. Please try again or contact support.');
                  } finally {
                    setSaving(false);
                  }
                }} 
                disabled={saving || selectedServices.length === 0}
                sx={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1)', color: '#fff', px: 6, py: 1.5, borderRadius: 3, fontWeight: 'bold', fontSize: 16,
                  '&:hover': { background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)' }, '&:disabled': { opacity: 0.5 }
                }}
              >
                {saving ? 'Processing...' : billingType === 'ONE_TIME' ? 'Pay with Stripe' : `Subscribe ${billingType === 'MONTHLY' ? 'Monthly' : 'Yearly'}`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0 || saving} onClick={() => setActiveStep(prev => prev - 1)}
            sx={{ color: themeStyles.textMuted, '&:disabled': { opacity: 0.3 } }}>
            <ArrowBack sx={{ mr: 1 }} /> Back
          </Button>
          {activeStep < 4 && (
            <Button variant="contained" onClick={handleNext} disabled={saving || 
              (activeStep === 0 && (!formData.firstName || !formData.lastName || !formData.email)) ||
              (activeStep === 1 && selectedServices.length === 0) ||
              (activeStep === 3 && !formData.signature)
            }
              sx={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1)', color: '#fff', px: 4, borderRadius: 2,
                '&:hover': { background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)' }, '&.Mui-disabled': { opacity: 0.5 }
              }}>
              {saving ? 'Saving...' : 'Continue'} <ArrowForward sx={{ ml: 1 }} />
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
