'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Stack, Card, CardContent,
  Grid, Divider, CircularProgress, Alert,
} from '@mui/material';
import { PersonAdd, Refresh, Business, Email, Phone, TrendingUp, Receipt, Assignment } from '@mui/icons-material';

// Glass theme matching admin page
const glassTheme = {
  cardBg: 'rgba(15, 23, 42, 0.6)',
  cardBorder: 'rgba(99, 102, 241, 0.2)',
  cardGlow: '0 4px 30px rgba(0,0,0,0.3)',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  tableBg: 'rgba(15, 23, 42, 0.4)',
  tableHeaderBg: 'rgba(99, 102, 241, 0.15)',
  tableRowHover: 'rgba(99, 102, 241, 0.05)',
  tableRowBorder: 'rgba(99, 102, 241, 0.1)',
};

const statusColors: Record<string, string> = {
  PROSPECT: '#f59e0b',
  ACTIVE: '#10b981',
  CHURNED: '#ef4444',
  ON_HOLD: '#6366f1',
};

const tierColors: Record<string, string> = {
  TIER_A: '#f59e0b',
  TIER_B: '#6366f1',
  TIER_C: '#94a3b8',
};

interface ClientRecord {
  id: string;
  leadId: string | null;
  company: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  clientTier: string;
  convertedAt: string;
  stripeCustomerId: string | null;
  createdAt: string;
  lead?: { id: string; aiiTier: string | null; aiiPipelineStage: string | null };
  contracts?: any[];
  payments?: any[];
  subscriptions?: any[];
  invoices?: any[];
}

export default function ClientsTab() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [search, setSearch] = useState('');

  // Detail drawer
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [clientDetail, setClientDetail] = useState<any>(null);

  // New client dialog
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    company: '', firstName: '', lastName: '', email: '', phone: '',
    status: 'PROSPECT', clientTier: 'TIER_C',
  });
  const [saving, setSaving] = useState(false);

  // Convert lead dialog
  const [convertLeadId, setConvertLeadId] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (tierFilter) params.set('tier', tierFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/clients?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClients(data.clients || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tierFilter, search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const fetchClientDetail = async (clientId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClientDetail(data.client);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateClient = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientForm),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNewClientOpen(false);
      setNewClientForm({ company: '', firstName: '', lastName: '', email: '', phone: '', status: 'PROSPECT', clientTier: 'TIER_C' });
      fetchClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConvertLead = async (clientId: string) => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/convert`, { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      fetchClients();
      if (detailOpen) fetchClientDetail(clientId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openDetail = (client: ClientRecord) => {
    setSelectedClient(client);
    setDetailOpen(true);
    fetchClientDetail(client.id);
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: glassTheme.textPrimary }}>
          👥 Clients
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchClients} size="small">
            Refresh
          </Button>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setNewClientOpen(true)} size="small">
            New Client
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          sx={{ '& .MuiInputBase-root': { color: glassTheme.textPrimary } }} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ color: glassTheme.textSecondary }}>Status</InputLabel>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            sx={{ color: glassTheme.textPrimary, '.MuiOutlinedInput-notchedOutline': { borderColor: glassTheme.cardBorder } }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PROSPECT">Prospect</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="CHURNED">Churned</MenuItem>
            <MenuItem value="ON_HOLD">On Hold</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ color: glassTheme.textSecondary }}>Tier</InputLabel>
          <Select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
            sx={{ color: glassTheme.textPrimary, '.MuiOutlinedInput-notchedOutline': { borderColor: glassTheme.cardBorder } }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="TIER_A">Tier A</MenuItem>
            <MenuItem value="TIER_B">Tier B</MenuItem>
            <MenuItem value="TIER_C">Tier C</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Clients table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
      ) : clients.length === 0 ? (
        <Typography sx={{ color: glassTheme.textSecondary, textAlign: 'center', py: 4 }}>
          No clients yet. Create one or convert a lead.
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: glassTheme.tableBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: glassTheme.tableHeaderBg }}>
                <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600 }}>Company</TableCell>
                <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600 }}>Contact</TableCell>
                <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600 }}>Tier</TableCell>
                <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600 }}>Client Since</TableCell>
                <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600 }}>Invoices</TableCell>
                <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600 }}>Subscriptions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id} hover onClick={() => openDetail(c)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: glassTheme.tableRowHover }, borderBottom: `1px solid ${glassTheme.tableRowBorder}` }}>
                  <TableCell sx={{ color: glassTheme.textPrimary }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Business fontSize="small" sx={{ color: glassTheme.textSecondary }} />
                      {c.company || '—'}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary }}>
                    {c.firstName || ''} {c.lastName || ''}{' '}
                    {c.email && <Typography variant="caption" sx={{ color: glassTheme.textSecondary, display: 'block' }}>{c.email}</Typography>}
                  </TableCell>
                  <TableCell><Chip label={c.status} size="small" sx={{ bgcolor: `${statusColors[c.status] || '#666'}22`, color: statusColors[c.status] || '#999', borderColor: statusColors[c.status] || '#666' }} /></TableCell>
                  <TableCell><Chip label={c.clientTier.replace('TIER_', 'Tier ')} size="small" sx={{ bgcolor: `${tierColors[c.clientTier] || '#666'}22`, color: tierColors[c.clientTier] || '#999' }} /></TableCell>
                  <TableCell sx={{ color: glassTheme.textSecondary }}>{new Date(c.convertedAt).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary }}>{c.invoices?.length || 0}</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary }}>{c.subscriptions?.length || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* New Client Dialog */}
      <Dialog open={newClientOpen} onClose={() => setNewClientOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Client</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Company" value={newClientForm.company} onChange={e => setNewClientForm(f => ({ ...f, company: e.target.value }))} fullWidth />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="First Name" value={newClientForm.firstName} onChange={e => setNewClientForm(f => ({ ...f, firstName: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Last Name" value={newClientForm.lastName} onChange={e => setNewClientForm(f => ({ ...f, lastName: e.target.value }))} fullWidth /></Grid>
            </Grid>
            <TextField label="Email" value={newClientForm.email} onChange={e => setNewClientForm(f => ({ ...f, email: e.target.value }))} fullWidth />
            <TextField label="Phone" value={newClientForm.phone} onChange={e => setNewClientForm(f => ({ ...f, phone: e.target.value }))} fullWidth />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={newClientForm.status} onChange={e => setNewClientForm(f => ({ ...f, status: e.target.value }))}>
                    <MenuItem value="PROSPECT">Prospect</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="CHURNED">Churned</MenuItem>
                    <MenuItem value="ON_HOLD">On Hold</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Tier</InputLabel>
                  <Select value={newClientForm.clientTier} onChange={e => setNewClientForm(f => ({ ...f, clientTier: e.target.value }))}>
                    <MenuItem value="TIER_A">Tier A — Enterprise</MenuItem>
                    <MenuItem value="TIER_B">Tier B — Growth</MenuItem>
                    <MenuItem value="TIER_C">Tier C — Starter</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewClientOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateClient} disabled={saving}>
            {saving ? 'Creating...' : 'Create Client'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Client Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{selectedClient?.company || `${selectedClient?.firstName || ''} ${selectedClient?.lastName || ''}`.trim() || 'Client'}</span>
          <Stack direction="row" spacing={1}>
            {selectedClient?.leadId && selectedClient?.status === 'PROSPECT' && (
              <Button variant="outlined" size="small" onClick={() => handleConvertLead(selectedClient.id)}>
                Convert Lead → Client
              </Button>
            )}
            <Button size="small" onClick={() => setDetailOpen(false)}>Close</Button>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? <CircularProgress /> : clientDetail ? (
            <Stack spacing={3}>
              {/* Contact Info */}
              <Card sx={{ bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: glassTheme.textPrimary, mb: 1 }}>Contact Info</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: glassTheme.textSecondary }}>Company</Typography>
                      <Typography sx={{ color: glassTheme.textPrimary }}>{clientDetail.company || '—'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: glassTheme.textSecondary }}>Name</Typography>
                      <Typography sx={{ color: glassTheme.textPrimary }}>{clientDetail.firstName} {clientDetail.lastName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: glassTheme.textSecondary }}>Email</Typography>
                      <Typography sx={{ color: glassTheme.textPrimary }}>{clientDetail.email || '—'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: glassTheme.textSecondary }}>Phone</Typography>
                      <Typography sx={{ color: glassTheme.textPrimary }}>{clientDetail.phone || '—'}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Chip label={clientDetail.status} sx={{ bgcolor: `${statusColors[clientDetail.status] || '#666'}22`, color: statusColors[clientDetail.status] || '#999' }} />
                    </Grid>
                    <Grid item xs={3}>
                      <Chip label={clientDetail.clientTier?.replace('TIER_', 'Tier ')} sx={{ bgcolor: `${tierColors[clientDetail.clientTier] || '#666'}22`, color: tierColors[clientDetail.clientTier] || '#999' }} />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: glassTheme.textSecondary }}>Client since {new Date(clientDetail.convertedAt).toLocaleDateString()}</Typography>
                    </Grid>
                  </Grid>
                  {clientDetail.leadId && (
                    <Typography variant="caption" sx={{ color: glassTheme.textSecondary, mt: 1, display: 'block' }}>
                      Originally converted from Lead {clientDetail.leadId}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Billing Address */}
              {(clientDetail.billingAddress || clientDetail.billingCity) && (
                <Card sx={{ bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}` }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: glassTheme.textPrimary, mb: 1 }}>Billing Address</Typography>
                    <Typography sx={{ color: glassTheme.textPrimary }}>
                      {clientDetail.billingAddress}<br />
                      {clientDetail.billingCity}{clientDetail.billingCity && clientDetail.billingState ? ', ' : ''}{clientDetail.billingState} {clientDetail.billingZip}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Contracts */}
              <Card sx={{ bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: glassTheme.textPrimary, mb: 1 }}>
                    <Assignment sx={{ verticalAlign: 'middle', mr: 0.5 }} /> Contracts ({clientDetail.contracts?.length || 0})
                  </Typography>
                  {(clientDetail.contracts?.length || 0) === 0 ? (
                    <Typography sx={{ color: glassTheme.textSecondary }}>No contracts yet</Typography>
                  ) : clientDetail.contracts.map((c: any) => (
                    <Box key={c.id} sx={{ py: 0.5 }}>
                      <Typography sx={{ color: glassTheme.textPrimary }}>{c.contractType || 'Contract'} — {c.signedAt ? new Date(c.signedAt).toLocaleDateString() : 'Not signed'}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Payments */}
              <Card sx={{ bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: glassTheme.textPrimary, mb: 1 }}>
                    <Receipt sx={{ verticalAlign: 'middle', mr: 0.5 }} /> Payments ({clientDetail.payments?.length || 0})
                  </Typography>
                  {(clientDetail.payments?.length || 0) === 0 ? (
                    <Typography sx={{ color: glassTheme.textSecondary }}>No payments yet</Typography>
                  ) : clientDetail.payments.map((p: any) => (
                    <Box key={p.id} sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: glassTheme.textPrimary }}>${(p.amount / 100).toFixed(2)}</Typography>
                      <Chip label={p.status} size="small" />
                      <Typography variant="caption" sx={{ color: glassTheme.textSecondary }}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Active Subscriptions */}
              <Card sx={{ bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: glassTheme.textPrimary, mb: 1 }}>
                    <TrendingUp sx={{ verticalAlign: 'middle', mr: 0.5 }} /> Subscriptions ({clientDetail.subscriptions?.length || 0})
                  </Typography>
                  {(clientDetail.subscriptions?.length || 0) === 0 ? (
                    <Typography sx={{ color: glassTheme.textSecondary }}>No active subscriptions</Typography>
                  ) : clientDetail.subscriptions.map((s: any) => (
                    <Box key={s.id} sx={{ py: 0.5 }}>
                      <Typography sx={{ color: glassTheme.textPrimary }}>
                        ${(s.amount / 100).toFixed(2)}/{s.interval === 'YEARLY' ? 'yr' : 'mo'} — <Chip label={s.status} size="small" />
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Invoices */}
              <Card sx={{ bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: glassTheme.textPrimary, mb: 1 }}>
                    📋 Invoices ({clientDetail.invoices?.length || 0})
                  </Typography>
                  {(clientDetail.invoices?.length || 0) === 0 ? (
                    <Typography sx={{ color: glassTheme.textSecondary }}>No invoices yet</Typography>
                  ) : clientDetail.invoices.map((inv: any) => (
                    <Box key={inv.id} sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: glassTheme.textPrimary }}>{inv.invoiceNumber}</Typography>
                      <Typography sx={{ color: glassTheme.textPrimary }}>${(inv.total / 100).toFixed(2)}</Typography>
                      <Chip label={inv.status} size="small" />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Stack>
          ) : (
            <Typography sx={{ color: glassTheme.textSecondary }}>No detail available</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}