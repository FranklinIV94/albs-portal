'use client';

import { useState } from 'react';
import { 
  Card, CardContent, TextField, Button, Typography, Box, 
  Chip, Avatar, Stack, Divider, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Paper
} from '@mui/material';
import { 
  PersonAdd, ContentCopy, OpenInNew, Refresh, 
  WorkHistory, Schedule, CheckCircle 
} from '@mui/icons-material';

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
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  isOnboarded: boolean;
  createdAt: string;
  positions: Position[];
}

export default function AdminDashboard() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Enrich a new lead
  const handleEnrich = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    setLead(null);

    try {
      // Detect if input is email or LinkedIn URL
      const isEmail = input.includes('@');
      const payload = isEmail 
        ? { email: input, generateToken: true }
        : { linkedinUrl: input, generateToken: true };

      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Enrichment failed');
      }

      setLead(data.lead);
      setLeads(prev => [data.lead, ...prev]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Copy onboarding link to clipboard
  const copyOnboardLink = (token: string) => {
    const url = `${window.location.origin}/onboard/${token}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Lead Enrichment Dashboard
      </Typography>

      {/* Input Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add New Lead
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="LinkedIn URL or Email address"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnrich()}
              helperText="Enter a LinkedIn profile URL or email to enrich"
            />
            <Button 
              variant="contained" 
              onClick={handleEnrich}
              disabled={loading || !input.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
            >
              {loading ? 'Enriching...' : 'Enrich'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {lead && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {lead.firstName} {lead.lastName}
                </Typography>
                <Typography color="text.secondary">
                  {lead.email}
                </Typography>
                {lead.phone && (
                  <Typography variant="body2" color="text.secondary">
                    📞 {lead.phone}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip 
                  icon={<ContentCopy />} 
                  label="Copy Link" 
                  onClick={() => copyOnboardLink(lead.token)}
                  variant="outlined"
                />
                <Chip 
                  icon={lead.isOnboarded ? <CheckCircle /> : <Schedule />}
                  label={lead.isOnboarded ? 'Onboarded' : 'Pending'}
                  color={lead.isOnboarded ? 'success' : 'default'}
                />
              </Stack>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Onboarding Link */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2">Onboarding Link:</Typography>
              <Typography 
                variant="body2" 
                sx={{ fontFamily: 'monospace', cursor: 'pointer' }}
                onClick={() => copyOnboardLink(lead.token)}
              >
                {typeof window !== 'undefined' && `${window.location.origin}/onboard/${lead.token}`}
              </Typography>
            </Alert>

            {/* Work History */}
            <Typography variant="h6" gutterBottom>
              <WorkHistory sx={{ mr: 1, verticalAlign: 'middle' }} />
              Work History ({lead.positions.length})
            </Typography>
            
            {lead.positions.length > 0 ? (
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
            ) : (
              <Typography color="text.secondary">No work history found</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Leads Table */}
      {leads.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              All Leads ({leads.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Companies</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Onboarding Link</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.firstName} {l.lastName}</TableCell>
                      <TableCell>{l.email || '-'}</TableCell>
                      <TableCell>{l.positions.length}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small"
                          label={l.isOnboarded ? 'Onboarded' : 'Pending'}
                          color={l.isOnboarded ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => copyOnboardLink(l.token)}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        {new Date(l.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
