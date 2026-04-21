'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Button, TextField, CircularProgress,
  Alert, Divider, Chip, Stepper, Step, StepLabel,
} from '@mui/material';
import { CheckCircle, Description, Payment } from '@mui/icons-material';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://onboarding.simplifyingbusinesses.com';

interface ContractData {
  albs: { name: string; address: string; email: string; phone: string };
  client: { company: string; firstName: string; lastName: string; email: string; phone: string; address: string };
  service: { product: string; name: string; description: string; deliverables: string[]; timeline: string };
  pricing: { totalFee: number; depositPercent: number; depositAmount: number; remainingBalance: number };
  paymentTerms: string;
  autoConvertClause: string;
  generatedAt: string;
}

export default function ContractPage() {
  const { token } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [signatureName, setSignatureName] = useState('');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState('');
  const [redirectToCheckout, setRedirectToCheckout] = useState<string | null>(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/client/${token}/contract`);
        const data = await res.json();
        if (!data.success) {
          setError(data.error || 'Contract not found');
          return;
        }
        setContract(data.contract);
        setContractData(data.contractData);
        setClientInfo(data.client);
      } catch (err) {
        setError('Failed to load contract');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchContract();
  }, [token]);

  const handleSign = async () => {
    if (!signatureName.trim() || signatureName.trim().length < 2) {
      setSignError('Please enter your full legal name');
      return;
    }

    setSigning(true);
    setSignError('');

    try {
      const res = await fetch(`/api/client/${token}/contract`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureName: signatureName.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setSignError(data.error || 'Failed to sign contract');
        return;
      }

      setContract(data.contract);

      // After signing, create deposit checkout
      if (clientInfo?.id) {
        const checkoutRes = await fetch(`/api/admin/clients/${clientInfo.id}/deposit-checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutData.success && checkoutData.checkoutUrl) {
          window.location.href = checkoutData.checkoutUrl;
          return;
        }
      }
    } catch (err) {
      setSignError('Failed to sign. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

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

  if (!contractData) return null;

  const isSigned = !!contract?.signedAt;
  const isPaid = paymentStatus === 'success';

  // If signed and paid, redirect to portal
  useEffect(() => {
    if (isSigned && isPaid) {
      router.push(`/client/${token}/portal`);
    }
  }, [isSigned, isPaid, token, router]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e3a8a', mb: 1 }}>
            Service Agreement
          </Typography>
          <Typography sx={{ color: '#6b7280' }}>
            All Lines Business Solutions
          </Typography>
        </Box>

        {/* Steps indicator */}
        <Stepper activeStep={isPaid ? 2 : isSigned ? 1 : 0} sx={{ mb: 4 }}>
          <Step>
            <StepLabel StepIconComponent={Description}>Review &amp; Sign</StepLabel>
          </Step>
          <Step>
            <StepLabel StepIconComponent={Payment}>Pay Deposit</StepLabel>
          </Step>
          <Step>
            <StepLabel StepIconComponent={CheckCircle}>Onboarded</StepLabel>
          </Step>
        </Stepper>

        {/* Payment status messages */}
        {paymentStatus === 'success' && isSigned && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Deposit payment received! Redirecting to your portal...
          </Alert>
        )}
        {paymentStatus === 'cancelled' && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Payment was cancelled. You can try again below.
          </Alert>
        )}

        {/* Contract Content */}
        <Card sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            {/* ALBS Header */}
            <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid #1e3a8a' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                {contractData.albs.name}
              </Typography>
              <Typography sx={{ color: '#6b7280', fontSize: 14 }}>
                {contractData.albs.address} · {contractData.albs.email} · {contractData.albs.phone}
              </Typography>
            </Box>

            {/* Client Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
                Client
              </Typography>
              <Typography sx={{ fontWeight: 600, color: '#1f2937' }}>
                {contractData.client.company || `${contractData.client.firstName} ${contractData.client.lastName}`}
              </Typography>
              <Typography sx={{ color: '#4b5563', fontSize: 14 }}>
                {contractData.client.address}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Service Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a', mb: 1 }}>
                {contractData.service.name}
              </Typography>
              <Typography sx={{ color: '#4b5563', mb: 2 }}>
                {contractData.service.description}
              </Typography>
            </Box>

            {/* Deliverables */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                Deliverables
              </Typography>
              {contractData.service.deliverables.map((d: string, i: number) => (
                <Typography key={i} sx={{ color: '#374151', pl: 2, mb: 0.5, fontSize: 14 }}>
                  • {d}
                </Typography>
              ))}
            </Box>

            {/* Timeline */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
                Timeline
              </Typography>
              <Typography sx={{ color: '#1f2937', fontWeight: 500 }}>{contractData.service.timeline}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Pricing */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a', mb: 2 }}>Pricing</Typography>
              <Box sx={{ bgcolor: '#f0f4f8', borderRadius: 1, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ color: '#4b5563' }}>Total Fee</Typography>
                  <Typography sx={{ fontWeight: 600, color: '#1f2937' }}>{formatCurrency(contractData.pricing.totalFee)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ color: '#4b5563' }}>Deposit ({contractData.pricing.depositPercent}%)</Typography>
                  <Typography sx={{ fontWeight: 600, color: '#1e3a8a' }}>{formatCurrency(contractData.pricing.depositAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#4b5563' }}>Remaining Balance</Typography>
                  <Typography sx={{ color: '#6b7280' }}>{formatCurrency(contractData.pricing.remainingBalance)}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Payment Terms */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
                Payment Terms
              </Typography>
              <Typography sx={{ color: '#4b5563', fontSize: 14 }}>{contractData.paymentTerms}</Typography>
            </Box>

            {/* Auto-Convert Clause */}
            <Box sx={{ mb: 3, bgcolor: '#eff6ff', borderLeft: '4px solid #1e3a8a', p: 2, borderRadius: '0 4px 4px 0' }}>
              <Typography sx={{ color: '#1e3a8a', fontWeight: 600, fontSize: 14 }}>
                {contractData.autoConvertClause}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Signature Block */}
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#6b7280', mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                Signature
              </Typography>

              {isSigned ? (
                <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 1, p: 2 }}>
                  <Typography sx={{ color: '#166534', fontWeight: 600 }}>
                    ✅ Signed by {contract.signatureName}
                  </Typography>
                  <Typography sx={{ color: '#15803d', fontSize: 13 }}>
                    {new Date(contract.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography sx={{ color: '#4b5563', fontSize: 14, mb: 2 }}>
                    By typing your full legal name below, you agree to the terms of this service agreement and authorize the deposit payment.
                  </Typography>
                  <TextField
                    fullWidth
                    label="Type your full legal name"
                    value={signatureName}
                    onChange={(e) => { setSignatureName(e.target.value); setSignError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSign()}
                    sx={{ mb: 2 }}
                    disabled={signing}
                  />
                  {signError && (
                    <Alert severity="error" sx={{ mb: 2 }}>{signError}</Alert>
                  )}
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleSign}
                    disabled={signing || signatureName.trim().length < 2}
                    sx={{
                      bgcolor: '#1e3a8a',
                      '&:hover': { bgcolor: '#1e40af' },
                      py: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    {signing ? <CircularProgress size={24} color="inherit" /> : 'Sign Agreement & Continue to Deposit Payment'}
                  </Button>
                </>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Footer */}
        <Typography sx={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', mt: 3 }}>
          Generated on {new Date(contractData.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} ·
          All Lines Business Solutions LLC · Punta Gorda, FL
        </Typography>
      </Box>
    </Box>
  );
}