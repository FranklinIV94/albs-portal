'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Chip, Stack, Button, CircularProgress,
  Alert, Tabs, Tab, TextField, LinearProgress
} from '@mui/material';
import { CheckCircle, CloudUpload, Message, Add, ArrowForward, Assessment } from '@mui/icons-material';
import UploadPanel from '@/components/UploadPanel';

const themeStyles = {
  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
  cardBg: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(255,255,255,0.12)',
  textPrimary: '#f0f0f8',
  textMuted: '#94a3b8',
  accentPurple: 'rgba(139,92,246,0.3)',
  accentGreen: 'rgba(34,197,94,0.2)',
  accentBlue: 'rgba(59,130,246,0.2)',
};

interface Service {
  id: string;
  name: string;
  priceDisplay: string;
  icon: string;
  category: string;
  description: string;
  inclusions?: string;
  exclusions?: string;
}

interface LeadData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  company: string | null;
  status: string;
  onboardingCompleted: boolean;
  serviceCategories: string | null;
  leadServices: Array<{ service: Service }>;
}

export default function ClientPortal() {
  const { token } = useParams();
  const [lead, setLead] = useState<LeadData | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [addingService, setAddingService] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState('');

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [leadRes, servicesRes] = await Promise.all([
        fetch(`/api/client/${token}`),
        fetch('/api/client/services'),
      ]);
      const leadData = await leadRes.json();
      const servicesData = await servicesRes.json();
      if (!leadData.success) { setError(leadData.error || 'Failed'); return; }
      setLead(leadData.lead);
      setAllServices(servicesData.services || []);
    } catch { setError('Failed to load portal'); }
    finally { setLoading(false); }
  };

  const handleAddService = async (serviceId: string) => {
    setAddingService(serviceId);
    try {
      const res = await fetch(`/api/client/${token}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      });
      const data = await res.json();
      setAddSuccess(data.success ? '✅ Service added! We\'ll be in touch shortly.' : `❌ ${data.error}`);
      setTimeout(() => setAddSuccess(''), 4000);
      if (data.success) fetchData();
    } catch { setAddSuccess('❌ Failed'); }
    setAddingService(null);
  };

  const categories = ['ALL', 'AI_SERVICES', 'TAX_BUSINESS', 'PAYROLL_BOOKKEEPING', 'MARKETING', 'INSURANCE', 'CONSULTING'];
  const categoryLabels: Record<string, string> = {
    ALL: 'All', AI_SERVICES: 'AI', TAX_BUSINESS: 'Tax', PAYROLL_BOOKKEEPING: 'Payroll', MARKETING: 'Marketing', INSURANCE: 'Insurance', CONSULTING: 'Consulting'
  };

  const filteredServices = allServices.filter(s => selectedCategory === 'ALL' || s.category === selectedCategory);
  const currentServices = lead?.leadServices?.map(ls => ls.service) || [];
  const currentServiceIds = new Set(currentServices.map(s => s.id));

  if (loading) return (
    <Box sx={{ minHeight: '100vh', bgcolor: themeStyles.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress sx={{ color: '#8b5cf6' }} />
    </Box>
  );

  if (error) return (
    <Box sx={{ minHeight: '100vh', bgcolor: themeStyles.background, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 4, p: 4, maxWidth: 400, textAlign: 'center' }}>
        <Typography sx={{ color: '#ef4444', fontSize: 24, fontWeight: 'bold', mb: 2 }}>Access Denied</Typography>
        <Typography sx={{ color: themeStyles.textMuted }}>{error}</Typography>
      </Card>
    </Box>
  );

  const quickStats = [
    { label: 'Active Services', value: currentServices.length, icon: '📋' },
    { label: 'Messages', value: '0 unread', icon: '💬' },
    { label: 'Documents', value: '0 files', icon: '📄' },
    { label: 'Next Step', value: currentServices.length === 0 ? 'Add Services' : 'Book Call', icon: '➡️' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: themeStyles.background }}>
      {/* Header */}
      <Box sx={{ p: 4, pb: 2 }}>
        <Typography sx={{ fontSize: 32, fontWeight: 'bold', mb: 1, background: 'linear-gradient(135deg, #a78bfa, #60a5fa, #f472b6)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome back, {lead?.firstName}!
        </Typography>
        <Typography sx={{ color: themeStyles.textMuted, fontSize: 16 }}>{lead?.company || 'Your Business'} · {lead?.email}</Typography>
        <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: `1px solid ${themeStyles.cardBorder}`, px: 4 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
          '& .MuiTab-root': { color: themeStyles.textMuted, fontWeight: 'bold' },
          '& .Mui-selected': { color: '#a78bfa !important' },
          '& .MuiTabs-indicator': { backgroundColor: '#a78bfa' },
        }}>
          <Tab label="📊 Overview" />
          <Tab label="📋 Services" />
          <Tab label="💬 Messages" />
          <Tab label="📄 Documents" />
          <Tab label="📅 Book" />
          <Tab label="✅ Past Jobs" />
        </Tabs>
      </Box>

      <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>

        {/* ====== OVERVIEW ====== */}
        {tab === 0 && (
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {quickStats.map(stat => (
                <Card key={stat.label} sx={{ flex: 1, bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 3 }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Typography sx={{ fontSize: 28 }}>{stat.icon}</Typography>
                    <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold', fontSize: 20 }}>{stat.value}</Typography>
                    <Typography sx={{ color: themeStyles.textMuted, fontSize: 13 }}>{stat.label}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>

            <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold', fontSize: 18 }}>Your Services</Typography>
                  <Button startIcon={<Add />} variant="contained" size="small" onClick={() => setTab(1)}
                    sx={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1)', borderRadius: 2 }}>
                    Add Service
                  </Button>
                </Box>
                {currentServices.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ color: themeStyles.textMuted, mb: 2 }}>No services added yet — browse our catalog below</Typography>
                    <Button variant="outlined" startIcon={<Add />} onClick={() => setTab(1)} sx={{ borderColor: '#a78bfa', color: '#a78bfa' }}>Browse Services</Button>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {currentServices.map(s => (
                      <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
                        <Typography sx={{ fontSize: 28 }}>{s.icon}</Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold' }}>{s.name}</Typography>
                          <Typography sx={{ color: themeStyles.textMuted, fontSize: 13 }}>{s.priceDisplay}</Typography>
                        </Box>
                        <Chip label="Active" color="success" size="small" />
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: themeStyles.accentBlue, border: '1px solid rgba(59,130,246,0.3)', borderRadius: 3 }}>
              <CardContent>
                <Typography sx={{ color: '#60a5fa', fontWeight: 'bold', mb: 2 }}>💡 Recommended Next Steps</Typography>
                <Stack spacing={1}>
                  {currentServices.length === 0 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><ArrowForward sx={{ color: '#60a5fa', fontSize: 18 }} /><Typography sx={{ color: themeStyles.textPrimary }}>Browse and add services to your package</Typography></Box>}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><ArrowForward sx={{ color: '#60a5fa', fontSize: 18 }} /><Typography sx={{ color: themeStyles.textPrimary }}>Book a strategy consultation</Typography></Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><ArrowForward sx={{ color: '#60a5fa', fontSize: 18 }} /><Typography sx={{ color: themeStyles.textPrimary }}>Upload any pending documents</Typography></Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}

        {/* ====== SERVICES ====== */}
        {tab === 1 && (
          <Stack spacing={3}>
            <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 3 }}>
              <CardContent>
                <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold', fontSize: 18, mb: 1 }}>Service Catalog</Typography>
                <Typography sx={{ color: themeStyles.textMuted, mb: 3, fontSize: 14 }}>Add services anytime. We'll confirm pricing and timeline.</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                  {categories.map(cat => (
                    <Chip key={cat} label={categoryLabels[cat]} clickable onClick={() => setSelectedCategory(cat)}
                      sx={{ bgcolor: selectedCategory === cat ? '#a78bfa' : 'rgba(255,255,255,0.08)', color: selectedCategory === cat ? '#fff' : themeStyles.textMuted, fontWeight: selectedCategory === cat ? 'bold' : 'normal' }}
                    />
                  ))}
                </Stack>
                <Stack spacing={2}>
                  {filteredServices.map(s => (
                    <Box key={s.id} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Typography sx={{ fontSize: 32 }}>{s.icon}</Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold' }}>{s.name}</Typography>
                          <Typography sx={{ color: '#a78bfa', fontSize: 14, fontWeight: 'bold', mb: 0.5 }}>{s.priceDisplay}</Typography>
                          <Typography sx={{ color: themeStyles.textMuted, fontSize: 13 }}>{s.description}</Typography>
                          {s.inclusions && <Typography sx={{ color: '#22c55e', fontSize: 12, mt: 0.5 }}>✓ {s.inclusions}</Typography>}
                        </Box>
                        <Box sx={{ minWidth: 100, textAlign: 'right' }}>
                          {currentServiceIds.has(s.id) ? (
                            <Chip label="Current" color="success" size="small" />
                          ) : (
                            <Button variant="contained" size="small" startIcon={addingService === s.id ? <CircularProgress size={14} color="inherit" /> : <Add />} onClick={() => handleAddService(s.id)} disabled={addingService === s.id}
                              sx={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: 2, whiteSpace: 'nowrap' }}>
                              Add
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
            {addSuccess && <Alert severity={addSuccess.startsWith('✅') ? 'success' : 'error'} sx={{ bgcolor: themeStyles.accentGreen, color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>{addSuccess}</Alert>}
          </Stack>
        )}

        {/* ====== MESSAGES ====== */}
        {tab === 2 && (
          <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 3 }}>
            <CardContent>
              <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold', fontSize: 18, mb: 2 }}>Messages</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>💬 Messages are sent directly to our support team. We respond within 24 business hours.</Alert>
              <Box sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Message sx={{ fontSize: 48, color: themeStyles.textMuted, mb: 1 }} />
                    <Typography sx={{ color: themeStyles.textMuted }}>No messages yet. Start a conversation below.</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField fullWidth placeholder="Type a message..." sx={{ '& .MuiOutlinedInput-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' }, '& .MuiInputLabel-root': { color: themeStyles.textMuted } }} />
                  <Button variant="contained" sx={{ background: '#a78bfa', px: 3 }}>Send</Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* ====== DOCUMENTS ====== */}
        {tab === 3 && (
          <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 3 }}>
            <CardContent>
              <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold', fontSize: 18, mb: 2 }}>Documents</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>📄 Upload tax documents, IDs, or other files. We receive them automatically.</Alert>
              <UploadPanel token={token as string} />
              <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                <Typography sx={{ color: themeStyles.textMuted, textAlign: 'center', py: 2 }}>No documents uploaded yet</Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* ====== BOOK ====== */}
        {tab === 4 && (
          <Stack spacing={3}>
            <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 3 }}>
              <CardContent>
                <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold', fontSize: 18, mb: 1 }}>📅 Book a Consultation</Typography>
                <Typography sx={{ color: themeStyles.textMuted, mb: 3 }}>Schedule a session with our team.</Typography>
                <Stack spacing={2}>
                  {[
                    { type: 'Strategy Call', duration: '30 min', desc: 'Discuss your business goals', icon: '🎯' },
                    { type: 'Tax Consultation', duration: '45 min', desc: 'Review your tax situation', icon: '🧮' },
                    { type: 'AI Assessment', duration: '60 min', desc: 'Deep dive into automation potential', icon: '🤖' },
                    { type: 'General Q&A', duration: '15 min', desc: 'Quick questions about services', icon: '❓' },
                  ].map(opt => (
                    <Box key={opt.type} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
                      <Typography sx={{ fontSize: 32 }}>{opt.icon}</Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold' }}>{opt.type}</Typography>
                        <Typography sx={{ color: themeStyles.textMuted, fontSize: 13 }}>{opt.desc}</Typography>
                      </Box>
                      <Chip label={opt.duration} size="small" sx={{ bgcolor: 'rgba(139,92,246,0.2)', color: '#a78bfa' }} />
                      <Button variant="outlined" size="small" href="/calendar" sx={{ borderColor: '#a78bfa', color: '#a78bfa' }}>Book</Button>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}

        {/* ====== PAST JOBS ====== */}
        {tab === 5 && (
          <Card sx={{ bgcolor: themeStyles.cardBg, border: `1px solid ${themeStyles.cardBorder}`, borderRadius: 3 }}>
            <CardContent>
              <Typography sx={{ color: themeStyles.textPrimary, fontWeight: 'bold', fontSize: 18, mb: 3 }}>✅ Past & Current Projects</Typography>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Assessment sx={{ fontSize: 48, color: themeStyles.textMuted, mb: 1 }} />
                <Typography sx={{ color: themeStyles.textMuted }}>No completed projects yet</Typography>
                <Typography sx={{ color: themeStyles.textMuted, fontSize: 13 }}>Your completed work will appear here</Typography>
              </Box>
            </CardContent>
          </Card>
        )}

      </Box>
    </Box>
  );
}
