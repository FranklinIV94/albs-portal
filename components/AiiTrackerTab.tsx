'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Button, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Stack, Divider,
  Tabs, Tab, Drawer, Menu, CircularProgress, Grid, Checkbox, Snackbar, Alert
} from '@mui/material';
import {
  CloudUpload, Search, Refresh, Visibility, Add,
  Email, Phone, Voicemail, Message, Close, ArrowForward, CheckCircle, Cancel, MoreVert,
  ArrowUpward, ArrowDownward, UnfoldMore
} from '@mui/icons-material';

const AIIO_STAGES = ['PENDING_APPROVAL', 'NOT_STARTED', 'OUTREACH', 'DISCOVERY', 'ASSESSMENT_PROPOSAL', 'NEGOTIATION', 'SIGNED', 'REJECTED'];
const PIPELINE_STAGES = AIIO_STAGES.filter(s => s !== 'PENDING_APPROVAL' && s !== 'REJECTED');
const STAGE_COLORS: Record<string, string> = {
  PENDING_APPROVAL: 'rgba(234,179,8,0.2)',
  NOT_STARTED: 'rgba(148,163,184,0.2)',
  OUTREACH: 'rgba(99,102,241,0.2)',
  DISCOVERY: 'rgba(168,85,247,0.2)',
  ASSESSMENT_PROPOSAL: 'rgba(245,158,11,0.2)',
  NEGOTIATION: 'rgba(249,115,22,0.2)',
  SIGNED: 'rgba(16,185,129,0.2)',
  REJECTED: 'rgba(239,68,68,0.2)',
};
const STAGE_CHIP_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  PENDING_APPROVAL: 'warning',
  NOT_STARTED: 'default',
  OUTREACH: 'primary',
  DISCOVERY: 'secondary',
  ASSESSMENT_PROPOSAL: 'warning',
  NEGOTIATION: 'warning',
  SIGNED: 'success',
  REJECTED: 'error',
};
const CHANNEL_ICONS: Record<string, string> = {
  email: '📧',
  phone: '📞',
  voicemail: '📬',
  linkedin: '💬',
  linkedin_message: '💬',
};
const OUTCOME_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  replied: 'success',
  booked: 'success',
  signed: 'success',
  pending: 'info',
  no_answer: 'warning',
  wrong_number: 'error',
  not_interested: 'error',
};
const INDUSTRIES = ['pool_service', 'hvac', 'electrical', 'roofing', 'lawn', 'carpentry', 'other'];

function capitalize(str: string): string {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function getScoreColor(score: number) {
  if (score >= 80) return '#16a34a';  // solid green
  if (score >= 70) return '#d97706';  // solid amber
  return '#dc2626';                   // solid red
}
function getTierColor(tier: string) {
  if (tier === 'A') return '#16a34a';  // solid green
  if (tier === 'B') return '#d97706';  // solid amber
  return '#6b7280';                    // solid gray
}

interface AiiTrackerTabProps {
  leads: any[];
  glassTheme: any;
}

interface AiiOutreachLog {
  id: string;
  leadId: string;
  date: string;
  channel: string;
  touchNum: number;
  outcome: string | null;
  notes: string | null;
  nextAction: string | null;
  nextDate: string | null;
  createdAt: string;
  lead?: any;
}

export default function AiiTrackerTab({ leads, glassTheme }: AiiTrackerTabProps) {
  const [subTab, setSubTab] = useState(0);
  const [aiiLeads, setAiiLeads] = useState<any[]>([]);
  const [outreachLogs, setOutreachLogs] = useState<AiiOutreachLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Lead List filters
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [showPending, setShowPending] = useState(true);

  // Outreach Log filters
  const [logSearch, setLogSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Dialogs
  const [logTouchOpen, setLogTouchOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [logForm, setLogForm] = useState({ channel: 'email', outcome: '', notes: '', nextAction: '', nextDate: '' });
  const [savingLog, setSavingLog] = useState(false);

  // Inbox selection
  const [inboxSelected, setInboxSelected] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuLead, setActionMenuLead] = useState<any>(null);

  // CSV Import
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number; skipped?: number } | null>(null);

  // Lead List pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Lead List sorting
  type SortField = 'company' | 'aiiScore' | 'aiiTier' | 'aiiIndustry' | 'aiiCity' | 'aiiPipelineStage';
  const [sortBy, setSortBy] = useState<SortField>('aiiScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Deal detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLead, setDrawerLead] = useState<any>(null);
  const [drawerLogs, setDrawerLogs] = useState<any[]>([]);

  useEffect(() => {
    const filtered = leads.filter(l => l.aiiTier || l.aiiScore || l.aiiPipelineStage || l.aiiOutreachHook);
    setAiiLeads(filtered);
  }, [leads]);

  const fetchOutreachLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (channelFilter) params.set('channel', channelFilter);
      if (outcomeFilter) params.set('outcome', outcomeFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await fetch(`/api/admin/leads/outreach?${params.toString()}`);
      const data = await res.json();
      setOutreachLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching outreach logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 2) fetchOutreachLogs();
  }, [subTab, channelFilter, outcomeFilter, dateFrom, dateTo]);

  const pendingLeads = useMemo(() => aiiLeads.filter(l => l.aiiPipelineStage === 'PENDING_APPROVAL'), [aiiLeads]);
  const pendingCount = pendingLeads.length;

  // Header metrics
  const tierACount = useMemo(() => aiiLeads.filter(l => l.aiiTier === 'A').length, [aiiLeads]);
  const tierBCount = useMemo(() => aiiLeads.filter(l => l.aiiTier === 'B').length, [aiiLeads]);
  const tierCCount = useMemo(() => aiiLeads.filter(l => l.aiiTier === 'C').length, [aiiLeads]);
  const notContactedCount = useMemo(() => aiiLeads.filter(l => !l.aiiNextAction && !l.aiiPipelineStage).length, [aiiLeads]);

  const filteredLeads = useMemo(() => {
    return aiiLeads.filter(l => {
      if (!showPending && (l.aiiPipelineStage === 'PENDING_APPROVAL' || l.aiiPipelineStage === 'REJECTED')) return false;
      const matchSearch = !search || (l.company || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.lastName || '').toLowerCase().includes(search.toLowerCase());
      const matchTier = !tierFilter || l.aiiTier === tierFilter;
      const matchIndustry = !industryFilter || l.aiiIndustry === industryFilter;
      return matchSearch && matchTier && matchIndustry;
    });
  }, [aiiLeads, search, tierFilter, industryFilter, showPending]);

  const paginatedLeads = useMemo(() => {
    const sorted = [...filteredLeads].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'company') cmp = (a.company || '').localeCompare(b.company || '');
      else if (sortBy === 'aiiScore') cmp = (a.aiiScore || 0) - (b.aiiScore || 0);
      else if (sortBy === 'aiiTier') {
        const order = { A: 3, B: 2, C: 1 };
        cmp = (order[a.aiiTier as keyof typeof order] || 0) - (order[b.aiiTier as keyof typeof order] || 0);
      }
      else if (sortBy === 'aiiIndustry') cmp = (a.aiiIndustry || '').localeCompare(b.aiiIndustry || '');
      else if (sortBy === 'aiiCity') cmp = ((a.aiiCity || '') + (a.aiiState || '')).localeCompare((b.aiiCity || '') + (b.aiiState || ''));
      else if (sortBy === 'aiiPipelineStage') cmp = (a.aiiPipelineStage || '').localeCompare(b.aiiPipelineStage || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    const start = page * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [filteredLeads, page, rowsPerPage, sortBy, sortDir]);

  const pipelineMetrics = useMemo(() => {
    const active = aiiLeads.filter(l => l.aiiPipelineStage && l.aiiPipelineStage !== 'NOT_STARTED' && l.aiiPipelineStage !== 'PENDING_APPROVAL' && l.aiiPipelineStage !== 'REJECTED');
    const totalValue = active.reduce((sum, l) => sum + (l.aiiWeightedValue || 0), 0);
    const outreachCount = aiiLeads.filter(l => l.aiiPipelineStage === 'OUTREACH').length;
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const closuresThisMonth = aiiLeads.filter(l => l.aiiPipelineStage === 'SIGNED' && l.updatedAt >= thisMonth).length;
    return { totalValue, activeCount: active.length, outreachCount, closuresThisMonth };
  }, [aiiLeads]);

  const pipelineStages = useMemo(() => {
    return PIPELINE_STAGES.map(stage => ({
      stage,
      leads: aiiLeads.filter(l => l.aiiPipelineStage === stage || (!l.aiiPipelineStage && stage === 'NOT_STARTED')),
    }));
  }, [aiiLeads]);

  const filteredLogs = useMemo(() => {
    return outreachLogs.filter(log => {
      const lead = log.lead || {};
      const matchSearch = !logSearch || (lead.company || '').toLowerCase().includes(logSearch.toLowerCase()) ||
        (lead.firstName || '').toLowerCase().includes(logSearch.toLowerCase());
      return matchSearch;
    });
  }, [outreachLogs, logSearch]);

  const handleApprove = async (leadId: string) => {
    try {
      const res = await fetch('/api/admin/leads/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (data.success) {
        setAiiLeads(prev => prev.map(l => l.id === leadId ? { ...l, aiiPipelineStage: 'NOT_STARTED' } : l));
        setInboxSelected((prev: Set<string>) => { const next = new Set(prev); next.delete(leadId); return next; });
        setSnackbar({ open: true, message: 'Lead approved and moved to pipeline', severity: 'success' });
        if (drawerLead?.id === leadId) setDrawerLead((prev: any) => ({ ...prev, aiiPipelineStage: 'NOT_STARTED' }));
      } else {
        setSnackbar({ open: true, message: data.error || 'Failed to approve', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Error approving lead', severity: 'error' });
    }
  };

  const handleReject = async (leadId: string, reason?: string) => {
    try {
      const res = await fetch('/api/admin/leads/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setAiiLeads(prev => prev.map(l => l.id === leadId ? { ...l, aiiPipelineStage: 'REJECTED' } : l));
        setInboxSelected((prev: Set<string>) => { const next = new Set(prev); next.delete(leadId); return next; });
        setSnackbar({ open: true, message: 'Lead rejected', severity: 'info' });
        if (drawerLead?.id === leadId) setDrawerLead((prev: any) => ({ ...prev, aiiPipelineStage: 'REJECTED' }));
      } else {
        setSnackbar({ open: true, message: data.error || 'Failed to reject', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Error rejecting lead', severity: 'error' });
    }
  };

  const handleBulkApprove = async () => {
    for (const id of Array.from(inboxSelected)) await handleApprove(id);
    setInboxSelected(new Set());
  };

  const handleBulkReject = async () => {
    for (const id of Array.from(inboxSelected)) await handleReject(id);
    setInboxSelected(new Set());
  };

  const openActionMenu = (e: React.MouseEvent<HTMLElement>, lead: any) => {
    e.stopPropagation();
    setActionMenuLead(lead);
    setActionMenuAnchor(e.currentTarget);
  };

  const handleLogTouch = async () => {
    if (!selectedLead) return;
    setSavingLog(true);
    try {
      const res = await fetch(`/api/admin/leads/${selectedLead.id}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: logForm.channel,
          outcome: logForm.outcome || undefined,
          notes: logForm.notes || undefined,
          nextAction: logForm.nextAction || undefined,
          nextDate: logForm.nextDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLogTouchOpen(false);
        setLogForm({ channel: 'email', outcome: '', notes: '', nextAction: '', nextDate: '' });
        setSelectedLead(null);
        fetchOutreachLogs();
      }
    } catch (err) {
      console.error('Error logging touch:', err);
    } finally {
      setSavingLog(false);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') { inQuotes = !inQuotes; }
          else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
          else { current += char; }
        }
        values.push(current.trim());
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
      });
      const res = await fetch('/api/admin/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: rows }),
      });
      const data = await res.json();
      setImportResult({ success: data.results?.success || 0, errors: data.results?.errors || 0, skipped: data.results?.skipped || 0 });
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const openDealDrawer = async (lead: any) => {
    setDrawerLead(lead);
    setDrawerOpen(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/outreach`);
      const data = await res.json();
      setDrawerLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching lead logs:', err);
    }
  };

  const updateDrawerLeadField = async (field: string, value: any) => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: drawerLead.id, [field]: value }),
      });
      const data = await res.json();
      if (data.success) setDrawerLead((prev: any) => ({ ...prev, [field]: value }));
    } catch (err) {
      console.error('Error updating field:', err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={subTab} onChange={(_, v) => setSubTab(v)}
          sx={{ '& .MuiTab-root': { color: glassTheme.textSecondary }, '& .Mui-selected': { color: '#6366f1' } }}>
          <Tab label="Lead List" />
          <Tab label="Pipeline" />
          <Tab label="Outreach Log" />
          <Tab label={`📥 Inbox${pendingCount > 0 ? ` (${pendingCount})` : ''}`} />
        </Tabs>
      </Box>

      {/* LEAD LIST SUB-TAB */}
      {subTab === 0 && (
        <Box>
          {/* Header metrics row */}
          <Stack direction="row" spacing={1.5} mb={2.5} flexWrap="wrap">
            <Chip label={`Total: ${aiiLeads.length}`} size="medium" sx={{ bgcolor: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontWeight: 600, fontSize: 13 }} />
            <Chip label={`Tier A: ${tierACount}`} size="medium" sx={{ bgcolor: 'rgba(22,163,74,0.15)', color: '#4ade80', fontWeight: 600, fontSize: 13 }} />
            <Chip label={`Tier B: ${tierBCount}`} size="medium" sx={{ bgcolor: 'rgba(217,119,6,0.15)', color: '#fbbf24', fontWeight: 600, fontSize: 13 }} />
            <Chip label={`Tier C: ${tierCCount}`} size="medium" sx={{ bgcolor: 'rgba(107,114,128,0.15)', color: '#9ca3af', fontWeight: 600, fontSize: 13 }} />
            {notContactedCount > 0 && (
              <Chip label={`Not Contacted: ${notContactedCount}`} size="medium" sx={{ bgcolor: 'rgba(168,85,247,0.15)', color: '#c084fc', fontWeight: 600, fontSize: 13 }} />
            )}
          </Stack>

          {/* Filter controls */}
          <Stack direction="row" spacing={1.5} mb={2.5} flexWrap="wrap" alignItems="center">
            <TextField size="small" placeholder="Search name/company…" value={search}
              onChange={e => setSearch(e.target.value)} sx={{ minWidth: 200 }}
              InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'rgba(240,240,248,0.4)' }} /> }} />
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Tier</InputLabel>
              <Select value={tierFilter} label="Tier" onChange={e => setTierFilter(e.target.value)}>
                <MenuItem value="">All Tiers</MenuItem>
                <MenuItem value="A">Tier A</MenuItem>
                <MenuItem value="B">Tier B</MenuItem>
                <MenuItem value="C">Tier C</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Industry</InputLabel>
              <Select value={industryFilter} label="Industry" onChange={e => setIndustryFilter(e.target.value)}>
                <MenuItem value="">All Industries</MenuItem>
                {INDUSTRIES.map(ind => <MenuItem key={ind} value={ind}>{capitalize(ind)}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant={showPending ? 'contained' : 'outlined'} size="small" onClick={() => setShowPending(!showPending)}>
              {showPending ? '✓ Show Pending' : '✗ Show Pending'}
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="outlined" size="small" onClick={() => setImportOpen(true)} startIcon={<CloudUpload />} sx={{ borderColor: '#6366f1', color: '#a5b4fc' }}>
              Import CSV
            </Button>
          </Stack>

          {/* Table */}
          <TableContainer component={Paper} sx={{ bgcolor: glassTheme.tableBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: glassTheme.tableHeaderBg }}>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    onClick={e => { e.stopPropagation(); setSortBy('aiiTier'); setSortDir(sortBy === 'aiiTier' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      Tier
                      {sortBy === 'aiiTier' ? (sortDir === 'asc' ? <ArrowUpward fontSize="small" sx={{ fontSize: 12 }} /> : <ArrowDownward fontSize="small" sx={{ fontSize: 12 }} />) : <UnfoldMore fontSize="small" sx={{ fontSize: 12, opacity: 0.4 }} />}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5, cursor: 'pointer', userSelect: 'none' }}
                    onClick={e => { e.stopPropagation(); setSortBy('aiiScore'); setSortDir(sortBy === 'aiiScore' && sortDir === 'desc' ? 'asc' : 'desc'); }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      Score
                      {sortBy === 'aiiScore' ? (sortDir === 'asc' ? <ArrowUpward fontSize="small" sx={{ fontSize: 12 }} /> : <ArrowDownward fontSize="small" sx={{ fontSize: 12 }} />) : <UnfoldMore fontSize="small" sx={{ fontSize: 12, opacity: 0.4 }} />}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    onClick={e => { e.stopPropagation(); setSortBy('company'); setSortDir(sortBy === 'company' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      Business
                      {sortBy === 'company' ? (sortDir === 'asc' ? <ArrowUpward fontSize="small" sx={{ fontSize: 12 }} /> : <ArrowDownward fontSize="small" sx={{ fontSize: 12 }} />) : <UnfoldMore fontSize="small" sx={{ fontSize: 12, opacity: 0.4 }} />}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5, cursor: 'pointer', userSelect: 'none' }}
                    onClick={e => { e.stopPropagation(); setSortBy('aiiIndustry'); setSortDir(sortBy === 'aiiIndustry' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      Industry
                      {sortBy === 'aiiIndustry' ? (sortDir === 'asc' ? <ArrowUpward fontSize="small" sx={{ fontSize: 12 }} /> : <ArrowDownward fontSize="small" sx={{ fontSize: 12 }} />) : <UnfoldMore fontSize="small" sx={{ fontSize: 12, opacity: 0.4 }} />}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    onClick={e => { e.stopPropagation(); setSortBy('aiiCity'); setSortDir(sortBy === 'aiiCity' && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      Location
                      {sortBy === 'aiiCity' ? (sortDir === 'asc' ? <ArrowUpward fontSize="small" sx={{ fontSize: 12 }} /> : <ArrowDownward fontSize="small" sx={{ fontSize: 12 }} />) : <UnfoldMore fontSize="small" sx={{ fontSize: 12, opacity: 0.4 }} />}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Outreach Hook</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ color: glassTheme.textSecondary, textAlign: 'center', py: 6 }}>
                      No AIIO leads found. Import a CSV to get started.
                    </TableCell>
                  </TableRow>
                ) : paginatedLeads.map(lead => (
                  <TableRow
                    key={lead.id}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(99,102,241,0.06)' },
                      borderBottom: `1px solid ${glassTheme.tableRowBorder}`,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onClick={() => openDealDrawer(lead)}
                  >
                    <TableCell sx={{ py: 1.75 }}>
                      {lead.aiiTier && (
                        <Box sx={{
                          width: 28, height: 28, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          bgcolor: getTierColor(lead.aiiTier), color: '#fff',
                          fontWeight: 700, fontSize: 13, fontFamily: 'monospace',
                        }}>
                          {lead.aiiTier}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      {lead.aiiScore != null && (
                        <Box sx={{
                          px: 1, py: 0.25, borderRadius: 1,
                          bgcolor: getScoreColor(lead.aiiScore), color: '#fff',
                          fontWeight: 700, fontSize: 12, display: 'inline-block',
                          minWidth: 36, textAlign: 'center',
                        }}>
                          {lead.aiiScore}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: glassTheme.textPrimary, py: 1.75 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.4 }}>{lead.company || '-'}</Typography>
                      {lead.firstName && (
                        <Typography variant="caption" sx={{ color: glassTheme.textSecondary, lineHeight: 1.4 }}>
                          {lead.firstName} {lead.lastName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: glassTheme.textSecondary, py: 1.75 }}>
                      {capitalize(lead.aiiIndustry) || '-'}
                    </TableCell>
                    <TableCell sx={{ color: glassTheme.textSecondary, py: 1.75, whiteSpace: 'nowrap' }}>
                      {[lead.aiiCity, lead.aiiState].filter(Boolean).join(', ') || '-'}
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      {lead.aiiOutreachHook ? (
                        <Tooltip title={lead.aiiOutreachHook} arrow placement="top">
                          <Typography variant="body2" noWrap sx={{ color: glassTheme.textSecondary, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}>
                            {lead.aiiOutreachHook}
                          </Typography>
                        </Tooltip>
                      ) : <Typography variant="body2" sx={{ color: glassTheme.textSecondary }}>—</Typography>}
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }} onClick={e => e.stopPropagation()}>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View details"><IconButton size="small" onClick={() => openDealDrawer(lead)}><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="More actions"><IconButton size="small" onClick={e => openActionMenu(e, lead)}><MoreVert fontSize="small" /></IconButton></Tooltip>
                      </Stack>
                      <Menu anchorEl={actionMenuAnchor} open={Boolean(actionMenuAnchor) && actionMenuLead?.id === lead.id}
                        onClose={() => { setActionMenuAnchor(null); setActionMenuLead(null); }}>
                        <MenuItem onClick={() => { openDealDrawer(lead); setActionMenuAnchor(null); setActionMenuLead(null); }}>
                          <Visibility fontSize="small" sx={{ mr: 1 }} /> View Details
                        </MenuItem>
                        <MenuItem onClick={() => { setSelectedLead(lead); setLogTouchOpen(true); setActionMenuAnchor(null); setActionMenuLead(null); }}>
                          <Add fontSize="small" sx={{ mr: 1 }} /> Log Touch
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredLeads.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[25, 50, 100, 150]}
            sx={{
              color: 'rgba(240,240,248,0.7)',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { color: 'rgba(240,240,248,0.7)' },
              borderTop: `1px solid ${glassTheme.tableRowBorder}`,
              mt: 0,
            }}
          />
        </Box>
      )}

      {/* PIPELINE SUB-TAB */}
      {subTab === 1 && (
        <Box>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: glassTheme.textSecondary }}>Total Pipeline Value</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#10b981' }}>
                  ${(pipelineMetrics.totalValue / 100).toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: glassTheme.textSecondary }}>Active Deals</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#6366f1' }}>{pipelineMetrics.activeCount}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: glassTheme.textSecondary }}>Closures This Month</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#10b981' }}>{pipelineMetrics.closuresThisMonth}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: glassTheme.textSecondary }}>Top of Funnel</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#f59e0b' }}>{pipelineMetrics.outreachCount}</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
            {pipelineStages.map(({ stage, leads: stageLeads }) => (
              <Box key={stage} sx={{ minWidth: 260, maxWidth: 280 }}>
                <Paper sx={{ p: 1.5, bgcolor: STAGE_COLORS[stage], borderRadius: 2, mb: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                      {stage.replace(/_/g, ' ')}
                    </Typography>
                    <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: 12 }}>
                      {stageLeads.length}
                    </Box>
                  </Stack>
                </Paper>
                {stageLeads.map(lead => (
                  <Paper key={lead.id} sx={{
                    p: 2, mb: 1.5, bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}`,
                    borderRadius: 2, cursor: 'pointer',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    '&:hover': { borderColor: 'rgba(99,102,241,0.4)', boxShadow: '0 0 0 1px rgba(99,102,241,0.2)' },
                  }}
                    onClick={() => openDealDrawer(lead)}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: glassTheme.textPrimary, lineHeight: 1.4, flex: 1, mr: 1 }}>
                        {lead.company || 'Unknown'}
                      </Typography>
                      {lead.aiiTier && (
                        <Box sx={{
                          width: 22, height: 22, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          bgcolor: getTierColor(lead.aiiTier), color: '#fff',
                          fontWeight: 700, fontSize: 11, flexShrink: 0,
                        }}>
                          {lead.aiiTier}
                        </Box>
                      )}
                    </Stack>
                    <Typography variant="caption" sx={{ color: glassTheme.textSecondary, display: 'block', mb: 0.75 }}>
                      {lead.aiiAssignedTo || 'Unassigned'}
                    </Typography>
                    <Stack direction="row" spacing={1} mb={0.5}>
                      {lead.aiiFee && <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>${(lead.aiiFee / 100).toLocaleString()}</Typography>}
                      {lead.aiiProbability != null && <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>{lead.aiiProbability}%</Typography>}
                      {lead.aiiWeightedValue != null && <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 600 }}>${(lead.aiiWeightedValue / 100).toLocaleString()}</Typography>}
                    </Stack>
                    {lead.aiiNextAction && (
                      <Typography variant="caption" display="block" sx={{ color: glassTheme.textSecondary, mt: 0.5, lineHeight: 1.4 }}>
                        → {lead.aiiNextAction}
                      </Typography>
                    )}
                    {lead.aiiProduct && (
                      <Box sx={{ mt: 0.75 }}>
                        <Chip label={lead.aiiProduct} size="small" variant="outlined" sx={{ fontSize: '10px', height: 20 }} />
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* OUTREACH LOG SUB-TAB */}
      {subTab === 2 && (
        <Box>
          <Stack direction="row" spacing={1.5} mb={2.5} flexWrap="wrap" alignItems="center">
            <TextField size="small" placeholder="Search lead…" value={logSearch}
              onChange={e => setLogSearch(e.target.value)} sx={{ minWidth: 180 }}
              InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'rgba(240,240,248,0.4)' }} /> }} />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Channel</InputLabel>
              <Select value={channelFilter} label="Channel" onChange={e => setChannelFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="email">📧 Email</MenuItem>
                <MenuItem value="phone">📞 Phone</MenuItem>
                <MenuItem value="voicemail">📬 Voicemail</MenuItem>
                <MenuItem value="linkedin">💬 LinkedIn</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Outcome</InputLabel>
              <Select value={outcomeFilter} label="Outcome" onChange={e => setOutcomeFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="replied">Replied</MenuItem>
                <MenuItem value="booked">Booked</MenuItem>
                <MenuItem value="signed">Signed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="no_answer">No Answer</MenuItem>
                <MenuItem value="wrong_number">Wrong Number</MenuItem>
                <MenuItem value="not_interested">Not Interested</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" type="date" label="From" value={dateFrom} onChange={e => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField size="small" type="date" label="To" value={dateTo} onChange={e => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            <Button variant="contained" startIcon={<Add />} onClick={() => setLogTouchOpen(true)}>Log Touch</Button>
            <Button variant="outlined" startIcon={<Refresh />} onClick={fetchOutreachLogs} size="small">Refresh</Button>
          </Stack>

          <TableContainer component={Paper} sx={{ bgcolor: glassTheme.tableBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: glassTheme.tableHeaderBg }}>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Date</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Lead</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Channel</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Touch</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Outcome</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Notes</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Next Action</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Next Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={24} /></TableCell></TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ color: glassTheme.textSecondary, textAlign: 'center', py: 6 }}>No outreach logs found</TableCell>
                  </TableRow>
                ) : filteredLogs.map(log => (
                  <TableRow key={log.id} sx={{
                    '&:hover': { bgcolor: 'rgba(99,102,241,0.06)' },
                    borderBottom: `1px solid ${glassTheme.tableRowBorder}`,
                    transition: 'background-color 0.15s',
                  }}>
                    <TableCell sx={{ color: glassTheme.textSecondary, py: 1.75 }}>{new Date(log.date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ color: glassTheme.textPrimary, py: 1.75 }}>
                      <Typography variant="body2" sx={{ lineHeight: 1.4 }}>{log.lead?.company || log.lead?.firstName || 'Unknown'}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: glassTheme.textSecondary, py: 1.75 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <span>{CHANNEL_ICONS[log.channel] || '📧'}</span>
                        <span style={{ textTransform: 'capitalize' }}>{log.channel.replace('_', ' ')}</span>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: glassTheme.textSecondary, py: 1.75 }}>#{log.touchNum}</TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      {log.outcome && (
                        <Chip label={log.outcome.replace(/_/g, ' ')} size="small"
                          color={OUTCOME_COLORS[log.outcome]} variant="outlined" sx={{ textTransform: 'capitalize' }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      {log.notes ? (
                        <Tooltip title={log.notes} arrow><Typography variant="body2" noWrap sx={{ color: glassTheme.textSecondary, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}>{log.notes}</Typography></Tooltip>
                      ) : <Typography variant="body2" sx={{ color: glassTheme.textSecondary }}>—</Typography>}
                    </TableCell>
                    <TableCell sx={{ color: glassTheme.textSecondary, py: 1.75 }}>{log.nextAction || '-'}</TableCell>
                    <TableCell sx={{ color: glassTheme.textSecondary, py: 1.75 }}>{log.nextDate ? new Date(log.nextDate).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* INBOX SUB-TAB */}
      {subTab === 3 && (
        <Box>
          {inboxSelected.size > 0 && (
            <Stack direction="row" spacing={1.5} mb={2} alignItems="center">
              <Typography variant="body2" sx={{ color: glassTheme.textSecondary }}>
                {inboxSelected.size} selected
              </Typography>
              <Button variant="contained" color="success" size="small" startIcon={<CheckCircle />} onClick={handleBulkApprove}>
                Approve All
              </Button>
              <Button variant="contained" color="error" size="small" startIcon={<Cancel />} onClick={handleBulkReject}>
                Reject All
              </Button>
            </Stack>
          )}
          <TableContainer component={Paper} sx={{ bgcolor: glassTheme.tableBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: glassTheme.tableHeaderBg }}>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }} padding="checkbox">
                    <Checkbox
                      size="small"
                      indeterminate={inboxSelected.size > 0 && inboxSelected.size < pendingLeads.length}
                      checked={pendingLeads.length > 0 && inboxSelected.size === pendingLeads.length}
                      onChange={e => {
                        if (e.target.checked) setInboxSelected(new Set(pendingLeads.map(l => l.id)));
                        else setInboxSelected(new Set());
                      }}
                      sx={{ color: 'rgba(240,240,248,0.4)' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Score</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Tier</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Company</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Industry</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Location</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Outreach Hook</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, py: 1.5 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ color: glassTheme.textSecondary, textAlign: 'center', py: 6 }}>
                      No pending leads. Import a CSV to queue new leads for approval.
                    </TableCell>
                  </TableRow>
                ) : pendingLeads.map(lead => (
                  <TableRow key={lead.id} sx={{
                    '&:hover': { bgcolor: 'rgba(99,102,241,0.06)' },
                    borderBottom: `1px solid ${glassTheme.tableRowBorder}`,
                    transition: 'background-color 0.15s',
                  }}>
                    <TableCell padding="checkbox" sx={{ py: 1.75 }}>
                      <Checkbox
                        size="small"
                        checked={inboxSelected.has(lead.id)}
                        onChange={e => {
                          setInboxSelected(prev => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(lead.id);
                            else next.delete(lead.id);
                            return next;
                          });
                        }}
                        sx={{ color: 'rgba(240,240,248,0.4)' }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      {lead.aiiScore != null && (
                        <Box sx={{
                          px: 1, py: 0.25, borderRadius: 1,
                          bgcolor: getScoreColor(lead.aiiScore), color: '#fff',
                          fontWeight: 700, fontSize: 12, display: 'inline-block',
                          minWidth: 36, textAlign: 'center',
                        }}>
                          {lead.aiiScore}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      {lead.aiiTier && (
                        <Box sx={{
                          width: 28, height: 28, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          bgcolor: getTierColor(lead.aiiTier), color: '#fff',
                          fontWeight: 700, fontSize: 13, fontFamily: 'monospace',
                        }}>
                          {lead.aiiTier}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: glassTheme.textPrimary, py: 1.75 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.4 }}>{lead.company || '-'}</Typography>
                      {lead.firstName && (
                        <Typography variant="caption" sx={{ color: glassTheme.textSecondary, lineHeight: 1.4 }}>
                          {lead.firstName} {lead.lastName}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: glassTheme.textSecondary, py: 1.75 }}>
                      {capitalize(lead.aiiIndustry) || '-'}
                    </TableCell>
                    <TableCell sx={{ color: glassTheme.textSecondary, py: 1.75, whiteSpace: 'nowrap' }}>
                      {[lead.aiiCity, lead.aiiState].filter(Boolean).join(', ') || '-'}
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      {lead.aiiOutreachHook ? (
                        <Tooltip title={lead.aiiOutreachHook} arrow placement="top">
                          <Typography variant="body2" noWrap sx={{ color: glassTheme.textSecondary, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}>
                            {lead.aiiOutreachHook}
                          </Typography>
                        </Tooltip>
                      ) : <Typography variant="body2" sx={{ color: glassTheme.textSecondary }}>—</Typography>}
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View details"><IconButton size="small" onClick={() => openDealDrawer(lead)}><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApprove(lead.id)}><CheckCircle fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => handleReject(lead.id)}><Cancel fontSize="small" /></IconButton></Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* LOG TOUCH DIALOG */}
      <Dialog open={logTouchOpen} onClose={() => setLogTouchOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}` } }}>
        <DialogTitle sx={{ color: glassTheme.textPrimary }}>Log Outreach Touch</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {!selectedLead ? (
              <FormControl fullWidth size="small">
                <InputLabel>Select Lead</InputLabel>
                <Select value="" label="Select Lead" onChange={e => setSelectedLead(aiiLeads.find(l => l.id === e.target.value))}>
                  {aiiLeads.map(l => <MenuItem key={l.id} value={l.id}>{l.company || l.firstName || l.id}</MenuItem>)}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{ p: 1.5, bgcolor: 'rgba(99,102,241,0.1)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: glassTheme.textPrimary }}>{selectedLead.company || 'Unknown'}</Typography>
                <Button size="small" onClick={() => setSelectedLead(null)}>Change</Button>
              </Box>
            )}
            <FormControl fullWidth size="small">
              <InputLabel>Channel</InputLabel>
              <Select value={logForm.channel} label="Channel" onChange={e => setLogForm(f => ({ ...f, channel: e.target.value }))}>
                <MenuItem value="email">📧 Email</MenuItem>
                <MenuItem value="phone">📞 Phone</MenuItem>
                <MenuItem value="voicemail">📬 Voicemail</MenuItem>
                <MenuItem value="linkedin">💬 LinkedIn</MenuItem>
                <MenuItem value="linkedin_message">💬 LinkedIn Message</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Outcome</InputLabel>
              <Select value={logForm.outcome} label="Outcome" onChange={e => setLogForm(f => ({ ...f, outcome: e.target.value }))}>
                <MenuItem value="">Select outcome…</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="replied">Replied</MenuItem>
                <MenuItem value="booked">Booked</MenuItem>
                <MenuItem value="signed">Signed</MenuItem>
                <MenuItem value="no_answer">No Answer</MenuItem>
                <MenuItem value="wrong_number">Wrong Number</MenuItem>
                <MenuItem value="not_interested">Not Interested</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth multiline rows={3} size="small" label="Notes" value={logForm.notes}
              onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} />
            <TextField fullWidth size="small" label="Next Action" value={logForm.nextAction}
              onChange={e => setLogForm(f => ({ ...f, nextAction: e.target.value }))} />
            <TextField fullWidth size="small" type="date" label="Next Date" value={logForm.nextDate}
              onChange={e => setLogForm(f => ({ ...f, nextDate: e.target.value }))} InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogTouchOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleLogTouch} disabled={!selectedLead || savingLog}>
            {savingLog ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV IMPORT DIALOG */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}` } }}>
        <DialogTitle sx={{ color: glassTheme.textPrimary }}>Import AIIO Leads from CSV</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <input accept=".csv" type="file" id="csv-import" style={{ display: 'none' }} onChange={handleCsvImport} />
            <label htmlFor="csv-import">
              <Button variant="outlined" component="span" startIcon={<CloudUpload />} disabled={importing}>
                {importing ? 'Importing…' : 'Select CSV File'}
              </Button>
            </label>
            {importResult && (
              <Box mt={2}>
                <Chip label={`${importResult.success} imported`} color="success" sx={{ mr: 1 }} />
                {(importResult.skipped ?? 0) > 0 && <Chip label={`${importResult.skipped} skipped (existing)`} color="warning" sx={{ mr: 1 }} />}
                {importResult.errors > 0 && <Chip label={`${importResult.errors} errors`} color="error" />}
              </Box>
            )}
            <Typography variant="caption" display="block" sx={{ mt: 2, color: glassTheme.textSecondary }}>
              Expected columns: Business Name, City, State, Industry, Website, Phone, Score, Tier, Outreach Hook, Top Gap / Operational Signals, Assigned To
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* DEAL DETAIL DRAWER */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 440, bgcolor: glassTheme.cardBg, borderLeft: `1px solid ${glassTheme.cardBorder}` } }}>
        {drawerLead && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ color: glassTheme.textPrimary }}>{drawerLead.company || 'Deal Details'}</Typography>
              <IconButton onClick={() => setDrawerOpen(false)}><Close /></IconButton>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {/* Approval actions for pending leads */}
            {drawerLead.aiiPipelineStage === 'PENDING_APPROVAL' && (
              <Stack direction="row" spacing={1} mb={2}>
                <Button variant="contained" color="success" fullWidth startIcon={<CheckCircle />} onClick={() => handleApprove(drawerLead.id)}>
                  Approve
                </Button>
                <Button variant="contained" color="error" fullWidth startIcon={<Cancel />} onClick={() => handleReject(drawerLead.id)}>
                  Reject
                </Button>
              </Stack>
            )}

            {/* Stage */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Stage</InputLabel>
              <Select value={drawerLead.aiiPipelineStage || 'NOT_STARTED'} label="Stage"
                onChange={e => updateDrawerLeadField('aiiPipelineStage', e.target.value)}>
                {AIIO_STAGES.map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
              </Select>
            </FormControl>

            {/* Product */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Product</InputLabel>
              <Select value={drawerLead.aiiProduct || ''} label="Product"
                onChange={e => updateDrawerLeadField('aiiProduct', e.target.value)}>
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Assessment">Assessment</MenuItem>
                <MenuItem value="Foundation">Foundation</MenuItem>
                <MenuItem value="Growth">Growth</MenuItem>
                <MenuItem value="Enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>

            {/* Fee / Probability / Weighted */}
            <Grid container spacing={1} mb={2}>
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="Fee ($)" type="number"
                  value={drawerLead.aiiFee ? drawerLead.aiiFee / 100 : ''}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    updateDrawerLeadField('aiiFee', val ? Math.round(val * 100) : undefined);
                  }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="Probability (%)" type="number"
                  value={drawerLead.aiiProbability ?? ''}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    updateDrawerLeadField('aiiProbability', isNaN(val) ? undefined : val);
                  }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth size="small" label="Weighted ($)" type="number"
                  value={drawerLead.aiiWeightedValue ? drawerLead.aiiWeightedValue / 100 : ''} InputProps={{ readOnly: true }} />
              </Grid>
            </Grid>

            {/* Close Date */}
            <TextField fullWidth size="small" type="date" label="Close Date"
              value={drawerLead.aiiCloseDate ? drawerLead.aiiCloseDate.split('T')[0] : ''}
              onChange={e => updateDrawerLeadField('aiiCloseDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />

            <Divider sx={{ mb: 2 }} />

            {/* Outreach Log for this lead */}
            <Typography variant="subtitle2" sx={{ color: glassTheme.textPrimary, mb: 1 }}>Outreach History</Typography>
            {drawerLogs.length === 0 ? (
              <Typography variant="caption" sx={{ color: glassTheme.textSecondary }}>No outreach logged yet</Typography>
            ) : (
              <Stack spacing={1}>
                {drawerLogs.map(log => (
                  <Paper key={log.id} sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Box>
                        <Typography variant="caption">{CHANNEL_ICONS[log.channel]} {log.channel} #{log.touchNum}</Typography>
                        {log.outcome && <Chip label={log.outcome} size="small" color={OUTCOME_COLORS[log.outcome] || 'default'} sx={{ ml: 1, fontSize: '10px' }} />}
                      </Box>
                      <Typography variant="caption" sx={{ color: glassTheme.textSecondary }}>{new Date(log.date).toLocaleDateString()}</Typography>
                    </Stack>
                    {log.notes && <Typography variant="caption" display="block" sx={{ color: glassTheme.textSecondary, mt: 0.5 }}>{log.notes}</Typography>}
                    {log.nextAction && <Typography variant="caption" display="block" sx={{ color: '#6366f1', mt: 0.5 }}>→ {log.nextAction}</Typography>}
                  </Paper>
                ))}
              </Stack>
            )}

            <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => { setSelectedLead(drawerLead); setDrawerOpen(false); setLogTouchOpen(true); }}>
              Log Touch
            </Button>
          </Box>
        )}
      </Drawer>

      {/* SNACKBAR */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
