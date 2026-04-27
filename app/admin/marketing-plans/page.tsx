'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Grid, Chip, Stack, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, CircularProgress, Divider, Menu,
  LinearProgress, Alert, Card, CardContent, Tooltip
} from '@mui/material';
import {
  Add, TrendingUp, Flag, Schedule, AttachMoney, Delete, Edit,
  Visibility, CheckCircle, Phone, Email, WhatsApp, Close,
  ArrowBack, Save, KeyboardArrowDown, TrendingDown, History,
  LocalFireDepartment, Campaign
} from '@mui/icons-material';

const API = 'https://onboarding.simplifyingbusinesses.com';

const STATUS_COLORS: Record<string, 'default'|'primary'|'secondary'|'success'|'warning'|'error'|'info'> = {
  DRAFT: 'default',
  ACTIVE: 'success',
  PAUSED: 'warning',
  COMPLETED: 'info',
  ARCHIVED: 'default',
};

const OUTREACH_STATUS_COLORS: Record<string, 'default'|'primary'|'secondary'|'success'|'warning'|'error'|'info'> = {
  PENDING: 'default',
  CONTACTED: 'primary',
  RESPONDED: 'warning',
  MEETING_BOOKED: 'info',
  PROPOSAL_SENT: 'secondary',
  NEGOTIATING: 'warning',
  CLOSED_WON: 'success',
  CLOSED_LOST: 'error',
  DISQUALIFIED: 'default',
};

const OUTREACH_STATUSES = [
  'PENDING', 'CONTACTED', 'RESPONDED', 'MEETING_BOOKED',
  'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST', 'DISQUALIFIED'
];

const METRIC_OPTIONS = [
  { value: 'calls_made', label: '📞 Calls Made' },
  { value: 'emails_sent', label: '📧 Emails Sent' },
  { value: 'voicemails_left', label: '📩 Voicemails Left' },
  { value: 'meetings_booked', label: '📅 Meetings Booked' },
  { value: 'proposals_sent', label: '📄 Proposals Sent' },
  { value: 'deals_closed_won', label: '✅ Deals Closed (Won)' },
  { value: 'deals_closed_lost', label: '❌ Deals Closed (Lost)' },
  { value: 'revenue_generated', label: '💰 Revenue Generated' },
];

const GLASS_BG = 'rgba(15,23,42,0.92)';
const GLASS_BORDER = 'rgba(99,102,241,0.3)';
const ACCENT = '#8b5cf6';
const ACCENT2 = '#6366f1';
const TEXT = '#f0f0f8';
const TEXT_SEC = 'rgba(240,240,248,0.7)';
const CARD_BG = 'rgba(10,18,40,0.95)';

export default function MarketingPlansPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [planTargets, setPlanTargets] = useState<any[]>([]);
  const [planMetrics, setPlanMetrics] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddTargets, setShowAddTargets] = useState(false);
  const [showLogMetric, setShowLogMetric] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [newPlan, setNewPlan] = useState({ name: '', description: '', targetCloseRate: 40, startDate: '', endDate: '', budget: '' });
  const [newMetric, setNewMetric] = useState({ metric: 'calls_made', value: 1, notes: '' });
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [targetFilter, setTargetFilter] = useState('');
  const [updatingTarget, setUpdatingTarget] = useState<string | null>(null);
  const [targetMenuAnchor, setTargetMenuAnchor] = useState<any>({});

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const data = await res.json();
      if (!data.authenticated) { window.location.href = '/admin/login'; return; }
      setCheckingAuth(false);
      fetchPlans();
      fetchLeads();
    } catch { window.location.href = '/admin/login'; }
  }

  async function fetchPlans() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/marketing-plans`);
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchPlanDetail(planId: string) {
    try {
      const res = await fetch(`${API}/api/admin/marketing-plans?planId=${planId}`);
      const data = await res.json();
      setSelectedPlan(data.plan);
      setPlanTargets(data.plan?.targets || []);
      setPlanMetrics(data.plan?.metrics || []);
    } catch (e) { console.error(e); }
  }

  async function fetchLeads() {
    try {
      const res = await fetch(`${API}/api/v1/leads?status=OUTREACH&limit=100`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (e) { console.error(e); }
  }

  async function createPlan() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/marketing-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan),
      });
      const data = await res.json();
      if (data.plan) {
        setPlans([data.plan, ...plans]);
        setShowCreate(false);
        setNewPlan({ name: '', description: '', targetCloseRate: 40, startDate: '', endDate: '', budget: '' });
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function updatePlan(planId: string, updates: any) {
    try {
      const res = await fetch(`${API}/api/admin/marketing-plans`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, ...updates }),
      });
      const data = await res.json();
      if (data.plan) {
        setPlans(plans.map(p => p.id === planId ? { ...p, ...data.plan } : p));
        if (selectedPlan?.id === planId) setSelectedPlan({ ...selectedPlan, ...data.plan });
      }
    } catch (e) { console.error(e); }
  }

  async function deletePlan(planId: string) {
    if (!confirm('Delete this plan and all its targets?')) return;
    try {
      await fetch(`${API}/api/admin/marketing-plans?planId=${planId}`, { method: 'DELETE' });
      setPlans(plans.filter(p => p.id !== planId));
      if (selectedPlan?.id === planId) setSelectedPlan(null);
    } catch (e) { console.error(e); }
  }

  async function addTargets() {
    if (selectedLeadIds.size === 0) return;
    setSaving(true);
    try {
      const targets = Array.from(selectedLeadIds).map(id => {
        const lead = leads.find(l => l.id === id);
        return {
          leadId: id,
          companyName: lead?.company || '',
          contactName: lead ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : '',
          phone: lead?.phone || '',
          email: lead?.email || '',
          industry: lead?.aiiIndustry || '',
          city: lead?.aiiCity || '',
          state: lead?.aiiState || '',
          dealSize: null,
        };
      });
      const res = await fetch(`${API}/api/admin/marketing-plans/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id, targets }),
      });
      const data = await res.json();
      if (data.targets?.length) {
        await fetchPlanDetail(selectedPlan.id);
        await fetchPlans();
        setSelectedLeadIds(new Set());
        setShowAddTargets(false);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function updateTarget(targetId: string, updates: any) {
    setUpdatingTarget(targetId);
    try {
      const res = await fetch(`${API}/api/admin/marketing-plans/targets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, ...updates }),
      });
      const data = await res.json();
      if (data.target) {
        setPlanTargets(planTargets.map(t => t.id === targetId ? { ...t, ...data.target } : t));
        // Refresh plan stats
        await fetchPlans();
      }
    } catch (e) { console.error(e); }
    setUpdatingTarget(null);
    setTargetMenuAnchor((a: any) => ({ ...a, [targetId]: null }));
  }

  async function logMetric() {
    if (!selectedPlan) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/marketing-plans/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id, ...newMetric }),
      });
      const data = await res.json();
      if (data.metric) {
        setPlanMetrics([...planMetrics, data.metric]);
        setShowLogMetric(false);
        setNewMetric({ metric: 'calls_made', value: 1, notes: '' });
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  if (checkingAuth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0f172a' }}>
        <CircularProgress sx={{ color: ACCENT }} />
      </Box>
    );
  }

  // ─── PLAN LIST VIEW ───
  if (!selectedPlan) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', p: 3 }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                📣 Marketing Plans
              </Typography>
              <Typography variant="body2" sx={{ color: TEXT_SEC, mt: 0.5 }}>
                Campaign tracking, target management, and close rate analytics
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreate(true)}
              sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 'bold', borderRadius: 2, boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
            >
              New Plan
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress sx={{ color: ACCENT }} /></Box>
          ) : plans.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', bgcolor: CARD_BG, border: `1px solid ${GLASS_BORDER}`, borderRadius: 3 }}>
              <Campaign sx={{ fontSize: 64, color: 'rgba(99,102,241,0.4)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: TEXT, mb: 1 }}>No marketing plans yet</Typography>
              <Typography sx={{ color: TEXT_SEC, mb: 3 }}>Create your first campaign plan to track targets and close rates</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreate(true)} sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Create First Plan
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {plans.map((plan: any) => {
                const closePct = plan.actualCloseRate || 0;
                const targetPct = plan.targetCloseRate || 0;
                const onTrack = closePct >= targetPct;
                const won = planTargets.find((t: any) => t.planId === plan.id && t.outcome === 'CLOSED_WON')?.id;
                return (
                  <Grid item xs={12} md={6} lg={4} key={plan.id}>
                    <Paper sx={{
                      bgcolor: CARD_BG, border: `1px solid ${GLASS_BORDER}`, borderRadius: 3,
                      overflow: 'hidden', transition: 'border-color 0.2s',
                      '&:hover': { borderColor: ACCENT },
                    }}>
                      <Box sx={{ p: 2.5, pb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Typography variant="h6" sx={{ color: TEXT, fontWeight: 700, flex: 1, pr: 1 }}>
                            {plan.name}
                          </Typography>
                          <Chip label={plan.status} size="small" color={STATUS_COLORS[plan.status] || 'default'} sx={{ fontSize: '0.7rem' }} />
                        </Box>
                        {plan.description && (
                          <Typography variant="body2" sx={{ color: TEXT_SEC, mb: 2, fontSize: '0.8rem' }}>
                            {plan.description.length > 80 ? plan.description.slice(0, 80) + '…' : plan.description}
                          </Typography>
                        )}
                        {/* Close Rate */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: TEXT_SEC }}>Close Rate</Typography>
                            <Typography variant="caption" sx={{ color: onTrack ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                              {closePct}% / {targetPct}% target
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(closePct, 100)}
                            sx={{
                              height: 8, borderRadius: 4,
                              bgcolor: 'rgba(255,255,255,0.1)',
                              '& .MuiLinearProgress-bar': { bgcolor: onTrack ? '#10b981' : '#f59e0b', borderRadius: 4 },
                            }}
                          />
                        </Box>
                        {/* Stats */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <Box sx={{ flex: 1, bgcolor: 'rgba(99,102,241,0.1)', borderRadius: 1.5, p: 1.2, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ color: TEXT, fontWeight: 700 }}>{plan.totalLeads || 0}</Typography>
                            <Typography variant="caption" sx={{ color: TEXT_SEC }}>Targets</Typography>
                          </Box>
                          <Box sx={{ flex: 1, bgcolor: 'rgba(16,185,129,0.1)', borderRadius: 1.5, p: 1.2, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 700 }}>{plan.convertedLeads || 0}</Typography>
                            <Typography variant="caption" sx={{ color: TEXT_SEC }}>Won</Typography>
                          </Box>
                          <Box sx={{ flex: 1, bgcolor: 'rgba(239,68,68,0.1)', borderRadius: 1.5, p: 1.2, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 700 }}>
                              {(plan.targets as any[])?.filter((t: any) => t.outcome === 'CLOSED_LOST').length || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ color: TEXT_SEC }}>Lost</Typography>
                          </Box>
                        </Box>
                        {/* Dates */}
                        {(plan.startDate || plan.endDate) && (
                          <Typography variant="caption" sx={{ color: TEXT_SEC, display: 'block', mb: 1.5 }}>
                            📅 {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : 'No start'} → {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'No end'}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ bgcolor: 'rgba(99,102,241,0.08)', borderTop: `1px solid ${GLASS_BORDER}`, p: 1.5, display: 'flex', gap: 1 }}>
                        <Button size="small" startIcon={<Visibility />} variant="text" onClick={() => { setSelectedPlan(plan); fetchPlanDetail(plan.id); }}
                          sx={{ color: ACCENT, fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' } }}>
                          View
                        </Button>
                        <Button size="small" startIcon={<Edit />} variant="text" onClick={() => { setEditingPlan(plan); setShowCreate(true); }}
                          sx={{ color: TEXT_SEC, fontSize: '0.75rem' }}>
                          Edit
                        </Button>
                        <Button size="small" startIcon={<Delete />} variant="text" onClick={() => deletePlan(plan.id)}
                          sx={{ color: '#ef4444', fontSize: '0.75rem', ml: 'auto' }}>
                          Delete
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>

        {/* Create / Edit Plan Dialog */}
        <Dialog open={showCreate} onClose={() => { setShowCreate(false); setEditingPlan(null); setNewPlan({ name: '', description: '', targetCloseRate: 40, startDate: '', endDate: '', budget: '' }); }}
          maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: CARD_BG, border: `1px solid ${GLASS_BORDER}`, borderRadius: 3 } }}>
          <DialogTitle sx={{ color: TEXT }}>
            {editingPlan ? '✏️ Edit Plan' : '📣 Create Marketing Plan'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Plan Name" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} fullWidth
                placeholder="e.g. Miami Electrical Q2 2026" InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputBase-input': { color: TEXT } }} />
              <TextField label="Description" value={newPlan.description} onChange={e => setNewPlan({ ...newPlan, description: e.target.value })} fullWidth multiline rows={2}
                placeholder="Campaign goals, focus industry, strategy notes…"
                InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputBase-input': { color: TEXT } }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Target Close Rate (%)" type="number" value={newPlan.targetCloseRate} onChange={e => setNewPlan({ ...newPlan, targetCloseRate: Number(e.target.value) })} fullWidth
                  InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputBase-input': { color: TEXT } }} />
                <TextField label="Budget ($)" type="number" value={newPlan.budget} onChange={e => setNewPlan({ ...newPlan, budget: e.target.value })} fullWidth
                  InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputBase-input': { color: TEXT } }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Start Date" type="date" value={newPlan.startDate} onChange={e => setNewPlan({ ...newPlan, startDate: e.target.value })} fullWidth
                  InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputBase-input': { color: TEXT } }} />
                <TextField label="End Date" type="date" value={newPlan.endDate} onChange={e => setNewPlan({ ...newPlan, endDate: e.target.value })} fullWidth
                  InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputBase-input': { color: TEXT } }} />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button onClick={() => { setShowCreate(false); setEditingPlan(null); }} sx={{ color: TEXT_SEC }}>Cancel</Button>
            <Button variant="contained" onClick={async () => {
              if (editingPlan) {
                await updatePlan(editingPlan.id, newPlan);
                setShowCreate(false);
                setEditingPlan(null);
                setNewPlan({ name: '', description: '', targetCloseRate: 40, startDate: '', endDate: '', budget: '' });
              } else {
                await createPlan();
              }
            }} disabled={saving || !newPlan.name.trim()}
              sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 'bold', borderRadius: 2 }}>
              {saving ? 'Saving…' : editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ─── PLAN DETAIL VIEW ───
  const closePct = selectedPlan.totalLeads > 0 ? Math.round((selectedPlan.convertedLeads / selectedPlan.totalLeads) * 100) : 0;
  const targetPct = selectedPlan.targetCloseRate || 0;
  const onTrack = closePct >= targetPct;
  const pipeline: Record<string, any[]> = {};
  OUTREACH_STATUSES.forEach(s => { pipeline[s] = planTargets.filter(t => t.outreachStatus === s); });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', p: 3 }}>
      <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Button startIcon={<ArrowBack />} onClick={() => setSelectedPlan(null)} variant="text" sx={{ color: TEXT_SEC }}>Back to Plans</Button>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ color: TEXT, fontWeight: 700 }}>{selectedPlan.name}</Typography>
            {selectedPlan.description && <Typography variant="body2" sx={{ color: TEXT_SEC }}>{selectedPlan.description}</Typography>}
          </Box>
          <Chip label={selectedPlan.status} color={STATUS_COLORS[selectedPlan.status] || 'default'} sx={{ fontWeight: 700 }} />
          <Button variant="outlined" startIcon={<Add />} onClick={() => setShowAddTargets(true)} size="small"
            sx={{ borderColor: GLASS_BORDER, color: TEXT, '&:hover': { borderColor: ACCENT, bgcolor: 'rgba(99,102,241,0.1)' } }}>
            Add Targets
          </Button>
          <Button variant="outlined" startIcon={<TrendingUp />} onClick={() => setShowLogMetric(true)} size="small"
            sx={{ borderColor: GLASS_BORDER, color: TEXT, '&:hover': { borderColor: ACCENT, bgcolor: 'rgba(99,102,241,0.1)' } }}>
            Log Activity
          </Button>
          {selectedPlan.status === 'DRAFT' && (
            <Button variant="contained" onClick={() => updatePlan(selectedPlan.id, { status: 'ACTIVE' })}
              sx={{ background: '#10b981', fontWeight: 'bold', borderRadius: 2 }}>
              ▶ Activate Plan
            </Button>
          )}
          {selectedPlan.status === 'ACTIVE' && (
            <Button variant="outlined" onClick={() => updatePlan(selectedPlan.id, { status: 'PAUSED' })}
              sx={{ borderColor: '#f59e0b', color: '#f59e0b' }}>
              ⏸ Pause
            </Button>
          )}
          {selectedPlan.status === 'PAUSED' && (
            <Button variant="contained" onClick={() => updatePlan(selectedPlan.id, { status: 'ACTIVE' })}
              sx={{ background: '#10b981', fontWeight: 'bold' }}>
              ▶ Resume
            </Button>
          )}
        </Box>

        {/* Stats Row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2, mb: 4 }}>
          {[
            { label: 'Total Targets', value: selectedPlan.totalLeads, color: '#6366f1', icon: '🎯' },
            { label: 'Close Rate', value: `${closePct}%`, color: onTrack ? '#10b981' : '#f59e0b', icon: onTrack ? '✅' : '⚠️' },
            { label: 'Target Rate', value: `${targetPct}%`, color: TEXT_SEC, icon: '🎯' },
            { label: 'Deals Won', value: selectedPlan.convertedLeads, color: '#10b981', icon: '🏆' },
            { label: 'In Pipeline', value: planTargets.filter(t => !['CLOSED_WON','CLOSED_LOST','DISQUALIFIED'].includes(t.outreachStatus)).length, color: '#6366f1', icon: '📋' },
            { label: 'Budget', value: selectedPlan.budget ? `$${(selectedPlan.budget / 100).toLocaleString()}` : '—', color: '#f59e0b', icon: '💰' },
          ].map((stat, i) => (
            <Paper key={i} sx={{ p: 2, bgcolor: CARD_BG, border: `1px solid ${GLASS_BORDER}`, borderRadius: 2, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>{stat.icon}</Typography>
              <Typography variant="h5" sx={{ color: stat.color, fontWeight: 700 }}>{stat.value}</Typography>
              <Typography variant="caption" sx={{ color: TEXT_SEC }}>{stat.label}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Close Rate Progress */}
        <Paper sx={{ p: 3, mb: 4, bgcolor: CARD_BG, border: `1px solid ${GLASS_BORDER}`, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: TEXT }}>📊 Close Rate Progress</Typography>
            <Typography variant="h6" sx={{ color: onTrack ? '#10b981' : '#ef4444', fontWeight: 700 }}>
              {closePct}% / {targetPct}% {onTrack ? '✅ On Track' : '⚠️ Behind Target'}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min((closePct / targetPct) * 100, 100)}
            sx={{
              height: 16, borderRadius: 8, mb: 1,
              bgcolor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: onTrack ? '#10b981' : '#f59e0b',
                borderRadius: 8,
              },
            }}
          />
          <Typography variant="caption" sx={{ color: TEXT_SEC }}>
            {selectedPlan.convertedLeads} deals won out of {selectedPlan.totalLeads} targets
            {targetPct > 0 && ` — need ${Math.ceil((targetPct / 100) * selectedPlan.totalLeads) - selectedPlan.convertedLeads} more wins to hit target`}
          </Typography>
        </Paper>

        {/* Pipeline Kanban */}
        <Typography variant="h6" sx={{ color: TEXT, mb: 2 }}>🔄 Outreach Pipeline</Typography>
        {planTargets.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: CARD_BG, border: `1px solid ${GLASS_BORDER}`, borderRadius: 3, mb: 4 }}>
            <Typography sx={{ color: TEXT_SEC, mb: 2 }}>No targets yet. Add leads to this plan to start tracking.</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowAddTargets(true)}
              sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 2 }}>
              Add Targets
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 3, mb: 4 }}>
            {OUTREACH_STATUSES.map(status => (
              <Box key={status} sx={{ minWidth: 220, maxWidth: 260 }}>
                <Paper sx={{ p: 1.5, bgcolor: CARD_BG, border: `1px solid ${GLASS_BORDER}`, borderRadius: 2, mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: TEXT_SEC, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
                    {status.replace(/_/g, ' ')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: ACCENT, ml: 1, fontWeight: 700 }}>
                    {pipeline[status].length}
                  </Typography>
                </Paper>
                <Stack spacing={1}>
                  {pipeline[status].map((target: any) => (
                    <Paper key={target.id} sx={{ p: 1.5, bgcolor: CARD_BG, border: `1px solid ${GLASS_BORDER}`, borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: ACCENT } }}
                      onClick={() => setTargetMenuAnchor((a: any) => ({ ...a, [target.id]: null }))}>
                      <Typography variant="body2" sx={{ color: TEXT, fontWeight: 600, fontSize: '0.8rem', mb: 0.5 }}>
                        {target.companyName || 'Unknown'}
                      </Typography>
                      {target.contactName && <Typography variant="caption" sx={{ color: TEXT_SEC, display: 'block' }}>{target.contactName}</Typography>}
                      {target.phone && <Typography variant="caption" sx={{ color: ACCENT, display: 'block', fontSize: '0.7rem' }}>{target.phone}</Typography>}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption" sx={{ color: TEXT_SEC }}>Touches: {target.touchCount}</Typography>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setTargetMenuAnchor((a: any) => ({ ...a, [target.id]: e.currentTarget })); }}
                          sx={{ color: TEXT_SEC, p: 0.2 }}>
                          <KeyboardArrowDown fontSize="small" />
                        </IconButton>
                      </Box>
                      {/* Target action menu */}
                      <Menu open={Boolean(targetMenuAnchor[target.id])} anchorEl={targetMenuAnchor[target.id]}
                        onClose={() => setTargetMenuAnchor((a: any) => ({ ...a, [target.id]: null }))}
                        PaperProps={{ sx: { bgcolor: CARD_BG, border: `1px solid ${GLASS_BORDER}` } }}>
                        <MenuItem dense disabled sx={{ color: TEXT_SEC, fontSize: '0.75rem' }}>Move to:</MenuItem>
                        {OUTREACH_STATUSES.map(s => (
                          <MenuItem key={s} dense onClick={() => updateTarget(target.id, { outreachStatus: s })}
                            disabled={updatingTarget === target.id || s === target.outreachStatus}
                            sx={{ fontSize: '0.8rem', color: s === target.outreachStatus ? ACCENT : TEXT }}>
                            <Chip label={s.replace(/_/g, ' ')} size="small" color={OUTREACH_STATUS_COLORS[s]} sx={{ fontSize: '0.65rem', mr: 1 }} />
                          </MenuItem>
                        ))}
                        <Divider />
                        <MenuItem dense onClick={() => updateTarget(target.id, { touchCount: (target.touchCount || 0) + 1, lastTouchDate: new Date().toISOString() })}
                          sx={{ fontSize: '0.8rem', color: '#10b981' }}>
                          +1 Touch
                        </MenuItem>
                        {target.notes && (
                          <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="caption" sx={{ color: TEXT_SEC, fontSize: '0.7rem' }}>Note: {target.notes}</Typography>
                          </Box>
                        )}
                      </Menu>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        )}

        {/* Historical Metrics */}
        {planMetrics.length > 0 && (
          <>
            <Typography variant="h6" sx={{ color: TEXT, mb: 2 }}>📈 Activity History</Typography>
            <Paper sx={{ p: 3, mb: 4, bgcolor: CARD_BG, border: `1px solid ${GLASS_BORDER}`, borderRadius: 3, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: TEXT_SEC, borderColor: GLASS_BORDER }}>Date</TableCell>
                    <TableCell sx={{ color: TEXT_SEC, borderColor: GLASS_BORDER }}>Activity</TableCell>
                    <TableCell sx={{ color: TEXT_SEC, borderColor: GLASS_BORDER }}>Value</TableCell>
                    <TableCell sx={{ color: TEXT_SEC, borderColor: GLASS_BORDER }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {planMetrics.slice().reverse().map((m: any) => (
                    <TableRow key={m.id} sx={{ '&:hover': { bgcolor: 'rgba(99,102,241,0.05)' } }}>
                      <TableCell sx={{ color: TEXT, borderColor: GLASS_BORDER, fontSize: '0.8rem' }}>
                        {new Date(m.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ color: TEXT, borderColor: GLASS_BORDER }}>
                        <Chip label={METRIC_OPTIONS.find(o => o.value === m.metric)?.label || m.metric} size="small" sx={{ fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell sx={{ color: '#10b981', borderColor: GLASS_BORDER, fontWeight: 700 }}>
                        {m.value}
                      </TableCell>
                      <TableCell sx={{ color: TEXT_SEC, borderColor: GLASS_BORDER, fontSize: '0.8rem' }}>
                        {m.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}
      </Box>

      {/* Add Targets Dialog */}
      <Dialog open={showAddTargets} onClose={() => { setShowAddTargets(false); setSelectedLeadIds(new Set()); }}
        maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: CARD_BG, border: `1px solid ${GLASS_BORDER}`, borderRadius: 3 } }}>
        <DialogTitle sx={{ color: TEXT }}>
          Add Targets from Lead Pool
          <Typography variant="caption" sx={{ color: TEXT_SEC, display: 'block', mt: 0.5 }}>
            Select leads to add to "{selectedPlan?.name}"
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" placeholder="Filter leads…" value={targetFilter}
            onChange={e => setTargetFilter(e.target.value)} sx={{ mb: 2, '& .MuiInputBase-input': { color: TEXT } }} />
          <Box sx={{ maxHeight: 400, overflowY: 'auto', border: `1px solid ${GLASS_BORDER}`, borderRadius: 2, p: 1 }}>
            {leads.filter(l => {
              const q = targetFilter.toLowerCase();
              return !q || l.company?.toLowerCase().includes(q) || l.firstName?.toLowerCase().includes(q) || l.aiiIndustry?.toLowerCase().includes(q) || l.aiiCity?.toLowerCase().includes(q);
            }).length === 0 ? (
              <Typography sx={{ color: TEXT_SEC, textAlign: 'center', py: 4 }}>No leads match your filter</Typography>
            ) : (
              leads.filter(l => {
                const q = targetFilter.toLowerCase();
                return !q || l.company?.toLowerCase().includes(q) || l.firstName?.toLowerCase().includes(q) || l.aiiIndustry?.toLowerCase().includes(q) || l.aiiCity?.toLowerCase().includes(q);
              }).map(lead => (
                <Box key={lead.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 1.5,
                  bgcolor: selectedLeadIds.has(lead.id) ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: `1px solid ${selectedLeadIds.has(lead.id) ? ACCENT : 'transparent'}`,
                  cursor: 'pointer', mb: 0.5, transition: 'all 0.15s',
                  '&:hover': { bgcolor: 'rgba(99,102,241,0.1)', borderColor: GLASS_BORDER },
                }} onClick={() => {
                  const next = new Set(selectedLeadIds);
                  if (next.has(lead.id)) next.delete(lead.id); else next.add(lead.id);
                  setSelectedLeadIds(next);
                }}>
                  <Checkbox checked={selectedLeadIds.has(lead.id)} size="small" sx={{ color: ACCENT, p: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: TEXT, fontWeight: 600 }}>{lead.company || `${lead.firstName} ${lead.lastName}`}</Typography>
                    <Typography variant="caption" sx={{ color: TEXT_SEC }}>
                      {lead.aiiCity || ''}{lead.aiiState ? `, ${lead.aiiState}` : ''} · {lead.aiiIndustry || 'Unknown'} · {lead.phone || 'No phone'}
                    </Typography>
                  </Box>
                  <Chip label={`Score ${lead.aiiScore || '—'}`} size="small" sx={{ fontSize: '0.65rem', bgcolor: 'rgba(99,102,241,0.2)', color: ACCENT }} />
                </Box>
              ))
            )}
          </Box>
          <Typography variant="caption" sx={{ color: TEXT_SEC, mt: 1, display: 'block' }}>
            {selectedLeadIds.size} lead{selectedLeadIds.size !== 1 ? 's' : ''} selected
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => { setShowAddTargets(false); setSelectedLeadIds(new Set()); }} sx={{ color: TEXT_SEC }}>Cancel</Button>
          <Button variant="contained" onClick={addTargets} disabled={saving || selectedLeadIds.size === 0}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 'bold', borderRadius: 2 }}>
            {saving ? 'Adding…' : `Add ${selectedLeadIds.size} Target${selectedLeadIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Log Activity Dialog */}
      <Dialog open={showLogMetric} onClose={() => setShowLogMetric(false)}
        maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: CARD_BG, border: `1px solid ${GLASS_BORDER}`, borderRadius: 3 } }}>
        <DialogTitle sx={{ color: TEXT }}>📈 Log Activity</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: TEXT_SEC }}>Activity Type</InputLabel>
              <Select value={newMetric.metric} label="Activity Type" onChange={e => setNewMetric({ ...newMetric, metric: e.target.value })}
                sx={{ color: TEXT, '& .MuiSelect-icon': { color: TEXT_SEC } }}>
                {METRIC_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Count / Value" type="number" value={newMetric.value} onChange={e => setNewMetric({ ...newMetric, value: Number(e.target.value) })} fullWidth size="small"
              InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputBase-input': { color: TEXT } }} />
            <TextField label="Notes (optional)" value={newMetric.notes} onChange={e => setNewMetric({ ...newMetric, notes: e.target.value })} fullWidth size="small"
              InputLabelProps={{ shrink: true }} sx={{ '& .MuiInputBase-input': { color: TEXT } }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setShowLogMetric(false)} sx={{ color: TEXT_SEC }}>Cancel</Button>
          <Button variant="contained" onClick={logMetric} disabled={saving}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 'bold', borderRadius: 2 }}>
            {saving ? 'Saving…' : 'Log Activity'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
