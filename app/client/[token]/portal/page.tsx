'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert, Chip, Divider, Button,
} from '@mui/material';
import { CheckCircle, Schedule, Payment, Email } from '@mui/icons-material';

interface PortalData {
  client: {
    id: string;
    company: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  lead: {
    aiiProduct: string | null;
    aiiFee: number | null;
  };
  contract: {
    signedAt: string | null;
    signatureName: string | null;
  } | null;
  payments: Array<{ amount: number; status: string; paidAt: string | null }>;
  projectStatus: string;
}

export default function ClientPortalPage() {
  const { token } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<PortalData | null>(null);

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        const res = await fetch(`/api/client/${token}/portal`);
        const json = await res.json();
        if (!json.success) {
          if (json.redirect === 'contract') {
            router.push(`/client/${token}/contract`);
            return;
          }
          setError(json.error || 'Failed to load portal');
          return;
        }
        setData(json);
      } catch {
        setError('Failed to load portal');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchPortal();
  }, [token, router]);

  const formatCurrency = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const productLabels: Record<string, string> = {
    Assessment: 'AIIO Assessment',
    Foundation: 'AIIO Foundation',
    Growth: 'AIIO Growth',
    Enterprise: 'AIIO Enterprise',
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
        <CircularProgress sx={{ color: '#1e3a8a' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', p: 3 }}>
        <Card sx={{ maxWidth: 500, width: '100%', p: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: '#ef4444', mb: 2 }}>⚠️ Error</Typography>
          <Typography sx={{ color: '#6b7280' }}>{error}</Typography>
        </Card>
      </Box>
    );
  }

  if (!data) return null;

  const clientName = [data.client.firstName, data.client.lastName].filter(Boolean).join(' ') || data.client.company || 'Client';
  const totalFee = data.lead.aiiFee || 0;
  const depositPaid = data.payments?.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0) || 0;
  const remainingBalance = Math.max(0, totalFee - depositPaid);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Welcome */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e3a8a', mb: 1 }}>
            Welcome, {clientName} 👋
          </Typography>
          <Typography sx={{ color: '#6b7280', fontSize: 18 }}>
            Your ALBS Client Portal
          </Typography>
        </Box>

        {/* Project Status */}
        <Card sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Schedule sx={{ color: '#1e3a8a' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
                Project Status
              </Typography>
            </Box>
            <Chip
              label={data.projectStatus || 'Kickoff Scheduled'}
              sx={{ bgcolor: '#eff6ff', color: '#1e3a8a', fontWeight: 600, fontSize: 14 }}
            />
          </CardContent>
        </Card>

        {/* Services */}
        <Card sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a', mb: 2 }}>
              🚀 Your Service
            </Typography>
            <Typography sx={{ fontWeight: 600, color: '#1f2937', fontSize: 18, mb: 1 }}>
              {productLabels[data.lead.aiiProduct || 'Assessment'] || data.lead.aiiProduct}
            </Typography>
            {totalFee > 0 && (
              <Typography sx={{ color: '#6b7280' }}>
                Total engagement value: {formatCurrency(totalFee)}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Payment sx={{ color: '#1e3a8a' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
                Payment Status
              </Typography>
            </Box>
            <Box sx={{ bgcolor: '#f0f4f8', borderRadius: 1, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: '#4b5563' }}>Deposit Paid</Typography>
                <Typography sx={{ fontWeight: 600, color: '#166534' }}>
                  {depositPaid > 0 ? formatCurrency(depositPaid) : '—'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: '#4b5563' }}>Remaining Balance</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1f2937' }}>
                  {remainingBalance > 0 ? formatCurrency(remainingBalance) : 'Paid in full ✓'}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: '#4b5563' }}>Total</Typography>
                <Typography sx={{ fontWeight: 700, color: '#1e3a8a' }}>{formatCurrency(totalFee)}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Contract Info */}
        {data.contract?.signedAt && (
          <Card sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircle sx={{ color: '#16a34a' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#16a34a' }}>
                  Agreement Signed
                </Typography>
              </Box>
              <Typography sx={{ color: '#4b5563' }}>
                Signed by {data.contract.signatureName} on{' '}
                {new Date(data.contract.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Contact */}
        <Card sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Email sx={{ color: '#1e3a8a' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
                Your Account Manager
              </Typography>
            </Box>
            <Typography sx={{ color: '#1f2937', fontWeight: 600 }}>Franklin Bryant IV</Typography>
            <Typography sx={{ color: '#6b7280', fontSize: 14 }}>
              Chief Operating Officer · All Lines Business Solutions
            </Typography>
            <Typography sx={{ color: '#2563eb', fontSize: 14 }}>
              <a href="mailto:support@simplifyingbusinesses.com" style={{ color: '#2563eb', textDecoration: 'none' }}>
                support@simplifyingbusinesses.com
              </a>
               · (561) 589-8900
            </Typography>
          </CardContent>
        </Card>

        {/* Footer */}
        <Typography sx={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', mt: 4 }}>
          © {new Date().getFullYear()} All Lines Business Solutions LLC · Punta Gorda, FL
        </Typography>
      </Box>
    </Box>
  );
}