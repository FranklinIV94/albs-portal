'use client';

import { useState } from 'react';
import { 
  Card, CardContent, Typography, Box, Checkbox, FormControlLabel,
  Button, Divider, Alert, Chip, Paper, Stack
} from '@mui/material';
import { ArrowForward, ArrowBack, CheckCircle } from '@mui/icons-material';

interface ServiceSelectionFormProps {
  initialData?: {
    aiAssessment?: boolean;
    processRedesign?: boolean;
    automationBuild?: boolean;
    knowledgeSystems?: boolean;
    customWorkflows?: boolean;
    fullImplementation?: boolean;
    taxPreparation?: boolean;
    taxPreparation1120?: boolean;
    taxPreparation1041?: boolean;
    payroll15?: boolean;
    payroll619?: boolean;
    payroll20plus?: boolean;
    notes?: string;
  };
  onNext: (data: any) => void;
  onBack: () => void;
}

const SERVICES = [
  {
    id: 'aiAssessment',
    name: 'AI Tools Assessment',
    price: '$999',
    description: '45-min discovery call + custom AI report + 30-min walkthrough. Guarantee: 5+ hours/week returned or full refund.',
    icon: '🤖',
    category: 'ai'
  },
  {
    id: 'processRedesign',
    name: 'Process Redesign',
    price: '$3,000–5,000',
    description: 'Map current workflows, design future state, remove waste. For broken processes identified in assessment.',
    icon: '📊',
    category: 'ai'
  },
  {
    id: 'automationBuild',
    name: 'Automation Build',
    price: '$1,000–3,000',
    description: 'Zapier/Make.com workflows connecting your existing tools. Build it, train you, hand it off.',
    icon: '⚡',
    category: 'ai'
  },
  {
    id: 'knowledgeSystems',
    name: 'Knowledge Systems',
    price: '$3,000+',
    description: 'Custom GPT trained on your data (videos, docs, processes). Team queries instead of interrupting you.',
    icon: '🧠',
    category: 'ai'
  },
  {
    id: 'customWorkflows',
    name: 'Custom Workflows',
    price: '$3,000–5,000',
    description: 'Advanced prompts + templates turning manual processes into one-click operations.',
    icon: '🔧',
    category: 'ai'
  },
  {
    id: 'fullImplementation',
    name: 'Full Implementation',
    price: '$5,000–10,000+',
    description: 'Custom agents running entire workflows. For tech-savvy clients or those with internal maintainer.',
    icon: '🚀',
    category: 'ai'
  }
];

const TAX_SERVICES = [
  {
    id: 'taxPreparation',
    name: 'Tax Preparation (Business)',
    price: 'Starting at $999',
    description: '1120-S + Bookkeeping. For corporations, trusts, estates, and complex filings.',
    icon: '📋',
    category: 'tax'
  },
  {
    id: 'taxPreparation1120',
    name: '1120 (C-Corporation)',
    price: 'Starting at $1,595',
    description: 'C-Corporation tax return filing. Includes all supporting schedules.',
    icon: '🏢',
    category: 'tax'
  },
  {
    id: 'taxPreparation1041',
    name: '1041 (Trusts & Estates)',
    price: 'Starting at $1,595',
    description: 'Trust and estate tax return filing. Complex trust accounting included.',
    icon: '🏛️',
    category: 'tax'
  },
  {
    id: 'payroll15',
    name: 'Payroll Setup (1-5 employees)',
    price: '$999',
    description: 'One-time setup for 1-5 employees/contractors.',
    icon: '👥',
    category: 'tax'
  },
  {
    id: 'payroll619',
    name: 'Payroll Setup (6-19 employees)',
    price: '$1,595',
    description: 'One-time setup for 6-19 employees/contractors.',
    icon: '👥👥',
    category: 'tax'
  },
  {
    id: 'payroll20plus',
    name: 'Payroll Setup (20+ employees)',
    price: '$2,095',
    description: 'One-time setup for 20+ employees/contractors.',
    icon: '🏢👥',
    category: 'tax'
  }
];

// TASK 1: Payroll & Bookkeeping (Monthly bundles)
const PAYROLL_BOOKKEEPING_SERVICES = [
  {
    id: 'payroll-bookkeeping-1-5',
    name: 'Payroll & Bookkeeping (1-5 Employees)',
    price: '$695/mo',
    description: '⭐ RECOMMENDED - Up to 400 transactions. Covers contractors + employees + full bookkeeping with monthly reconciliation.',
    icon: '⭐',
    category: 'payroll_bookkeeping'
  },
  {
    id: 'payroll-bookkeeping-6-19',
    name: 'Payroll & Bookkeeping (6-19 Employees)',
    price: '$895/mo',
    description: 'Any volume. Full bookkeeping + payroll processing with priority support.',
    icon: '💼',
    category: 'payroll_bookkeeping'
  },
  {
    id: 'payroll-bookkeeping-20-plus',
    name: 'Payroll & Bookkeeping (20+ Employees)',
    price: '$1,095/mo',
    description: 'Enterprise: Unlimited transactions, dedicated account manager, custom reporting.',
    icon: '🏢',
    category: 'payroll_bookkeeping'
  },
  {
    id: 'standalone-bookkeeping',
    name: 'Standalone Bookkeeping',
    price: '$495 + $125/hr',
    description: 'Monthly bookkeeping only (no payroll). Timecard tracking for hourly work.',
    icon: '📒',
    category: 'bookkeeping'
  }
];

// TASK 2: Marketing Services
const MARKETING_SERVICES = [
  {
    id: 'seo-optimization',
    name: 'SEO Optimization',
    price: 'Contact for pricing',
    description: 'Keyword research, on-page optimization, technical SEO audit.',
    icon: '🔍',
    category: 'marketing'
  },
  {
    id: 'website-redesign',
    name: 'Website Redesign',
    price: 'Contact for pricing',
    description: 'Modern UI/UX, mobile-responsive, CMS integration.',
    icon: '🎨',
    category: 'marketing'
  },
  {
    id: 'website-deployment',
    name: 'Website Deployment',
    price: 'Contact for pricing',
    description: 'Domain config, SSL, performance optimization, maintenance.',
    icon: '🌐',
    category: 'marketing'
  },
  {
    id: 'landing-pages',
    name: 'Landing Pages',
    price: 'Contact for pricing',
    description: 'High-converting pages with A/B testing and lead capture.',
    icon: '🎯',
    category: 'marketing'
  },
  {
    id: 'marketing-campaigns',
    name: 'Marketing Campaigns',
    price: 'Contact for pricing',
    description: 'Full-service digital campaigns across Google, Facebook, LinkedIn.',
    icon: '📢',
    category: 'marketing'
  },
  {
    id: 'lead-generation',
    name: 'Lead Generation',
    price: 'Contact for pricing',
    description: 'Inbound system with content, email sequences, CRM integration.',
    icon: '🎣',
    category: 'marketing'
  }
];

export default function ServiceSelectionForm({ initialData, onNext, onBack }: ServiceSelectionFormProps) {
  const [selected, setSelected] = useState<string[]>(() => {
    if (!initialData) return [];
    return Object.entries(initialData)
      .filter(([key, value]) => value === true && key !== 'notes')
      .map(([key]) => key);
  });
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  // AI Intake Fields
  const [showAiIntake, setShowAiIntake] = useState(false);
  const [aiLookingFor, setAiLookingFor] = useState('');
  const [aiHasAutomation, setAiHasAutomation] = useState('');
  const [aiAutomationDetails, setAiAutomationDetails] = useState('');
  const [aiPainPoints, setAiPainPoints] = useState('');
  const [aiCurrentTools, setAiCurrentTools] = useState('');
  const [aiAdditionalDetails, setAiAdditionalDetails] = useState('');

  // Check if any AI service is selected
  const aiServiceIds = ['aiAssessment', 'processRedesign', 'automationBuild', 'knowledgeSystems', 'customWorkflows', 'fullImplementation'];
  const hasAiSelected = selected.some(id => aiServiceIds.includes(id));

  // All service IDs for calculations
  const allServiceIds = [
    ...SERVICES.map(s => s.id),
    ...TAX_SERVICES.map(s => s.id),
    ...PAYROLL_BOOKKEEPING_SERVICES.map(s => s.id),
    ...MARKETING_SERVICES.map(s => s.id)
  ];

  const handleToggle = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    const data: any = {};
    SERVICES.forEach(s => data[s.id] = selected.includes(s.id));
    TAX_SERVICES.forEach(s => data[s.id] = selected.includes(s.id));
    PAYROLL_BOOKKEEPING_SERVICES.forEach(s => data[s.id] = selected.includes(s.id));
    MARKETING_SERVICES.forEach(s => data[s.id] = selected.includes(s.id));
    data.notes = notes;
    
    // Include AI intake fields if any AI service is selected
    if (hasAiSelected) {
      data.aiLookingFor = aiLookingFor;
      data.aiHasAutomation = aiHasAutomation;
      data.aiAutomationDetails = aiAutomationDetails;
      data.aiPainPoints = aiPainPoints;
      data.aiCurrentTools = aiCurrentTools;
      data.aiAdditionalDetails = aiAdditionalDetails;
    }
    
    onNext(data);
  };

  const totalEstimate = selected.reduce((acc, id) => {
    const service = [...SERVICES, ...TAX_SERVICES, ...PAYROLL_BOOKKEEPING_SERVICES, ...MARKETING_SERVICES].find(s => s.id === id);
    if (service) {
      if (service.price.includes('–')) {
        const [min] = service.price.replace('$', '').replace('Starting at ', '').replace('Contact for pricing', '0').split('–').map(n => parseInt(n) * 1000 || 0);
        return acc + min;
      } else if (service.price.startsWith('$') || service.price.startsWith('Starting at ')) {
        const priceNum = service.price.replace('Starting at ', '').replace('$', '').replace(',', '').replace('/mo', '').replace(' + ', '').split(' ')[0];
        return acc + parseInt(priceNum) || 0;
      }
    }
    return acc;
  }, 0);

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Select Your Services
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose the services you're interested in. We'll customize a proposal based on your needs.
        </Typography>

        {/* AI Services */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          🤖 AI Services
        </Typography>
        <Stack spacing={2} sx={{ mb: 4 }}>
          {SERVICES.map((service) => (
            <Paper 
              key={service.id}
              variant="outlined"
              sx={{ 
                p: 2, 
                borderColor: selected.includes(service.id) ? 'primary.main' : 'divider',
                bgcolor: selected.includes(service.id) ? 'primary.50' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => handleToggle(service.id)}
            >
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selected.includes(service.id)}
                    onChange={() => handleToggle(service.id)}
                  />
                }
                label={
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontWeight="bold">
                        {service.icon} {service.name}
                      </Typography>
                      <Chip label={service.price} color="primary" variant="outlined" size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {service.description}
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
              />
            </Paper>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Tax & Traditional Services */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          📋 Tax & Business Services
        </Typography>
        <Stack spacing={2} sx={{ mb: 4 }}>
          {TAX_SERVICES.map((service) => (
            <Paper 
              key={service.id}
              variant="outlined"
              sx={{ 
                p: 2, 
                borderColor: selected.includes(service.id) ? 'secondary.main' : 'divider',
                bgcolor: selected.includes(service.id) ? 'secondary.50' : 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => handleToggle(service.id)}
            >
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selected.includes(service.id)}
                    onChange={() => handleToggle(service.id)}
                  />
                }
                label={
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontWeight="bold">
                        {service.icon} {service.name}
                      </Typography>
                      <Chip label={service.price} variant="outlined" size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {service.description}
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
              />
            </Paper>
          ))}
        </Stack>

        {/* TASK 1: Payroll & Bookkeeping */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          💰 Payroll & Bookkeeping (Monthly)
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Choose a monthly bundle OR standalone bookkeeping. One-time payroll setup fees listed above.
          </Typography>
        </Alert>
        <Stack spacing={2} sx={{ mb: 4 }}>
          {PAYROLL_BOOKKEEPING_SERVICES.map((service) => (
            <Paper 
              key={service.id}
              variant="outlined"
              sx={{ 
                p: 2, 
                borderColor: selected.includes(service.id) ? 'success.main' : 'divider',
                bgcolor: selected.includes(service.id) ? 'success.50' : 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => handleToggle(service.id)}
            >
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selected.includes(service.id)}
                    onChange={() => handleToggle(service.id)}
                  />
                }
                label={
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontWeight="bold">
                        {service.icon} {service.name}
                      </Typography>
                      <Chip label={service.price} color="success" variant="outlined" size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {service.description}
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
              />
            </Paper>
          ))}
        </Stack>

        {/* TASK 2: Marketing Services */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          📣 Marketing Services
        </Typography>
        <Stack spacing={2} sx={{ mb: 4 }}>
          {MARKETING_SERVICES.map((service) => (
            <Paper 
              key={service.id}
              variant="outlined"
              sx={{ 
                p: 2, 
                borderColor: selected.includes(service.id) ? 'warning.main' : 'divider',
                bgcolor: selected.includes(service.id) ? 'warning.50' : 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => handleToggle(service.id)}
            >
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selected.includes(service.id)}
                    onChange={() => handleToggle(service.id)}
                  />
                }
                label={
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontWeight="bold">
                        {service.icon} {service.name}
                      </Typography>
                      <Chip label={service.price} color="warning" variant="outlined" size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {service.description}
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
              />
            </Paper>
          ))}
        </Stack>

        {/* AI Services Intake - Show when AI service is selected */}
        {hasAiSelected && (
          <>
            <Divider sx={{ my: 3 }} />
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>🤖 AI Services Selected</strong> — Please help us understand your needs
              </Typography>
            </Alert>
            
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                AI Project Details
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  What are you looking to have done?
                </Typography>
                <textarea
                  value={aiLookingFor}
                  onChange={(e) => setAiLookingFor(e.target.value)}
                  placeholder="Describe the AI solution you need..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontFamily: 'inherit',
                    fontSize: '14px'
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Do you have any automation in place currently?
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <label>
                    <input 
                      type="radio" 
                      name="aiHasAutomation" 
                      value="yes"
                      checked={aiHasAutomation === 'yes'}
                      onChange={(e) => setAiHasAutomation(e.target.value)}
                    /> Yes
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="aiHasAutomation" 
                      value="no"
                      checked={aiHasAutomation === 'no'}
                      onChange={(e) => setAiHasAutomation(e.target.value)}
                    /> No
                  </label>
                </Box>
                {aiHasAutomation === 'yes' && (
                  <textarea
                    value={aiAutomationDetails}
                    onChange={(e) => setAiAutomationDetails(e.target.value)}
                    placeholder="Tell us about your current automation tools and workflows..."
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontFamily: 'inherit',
                      fontSize: '14px'
                    }}
                  />
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  What are your main pain points?
                </Typography>
                <textarea
                  value={aiPainPoints}
                  onChange={(e) => setAiPainPoints(e.target.value)}
                  placeholder="What problems are you trying to solve? What takes too long?"
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontFamily: 'inherit',
                    fontSize: '14px'
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  What tools are you currently using?
                </Typography>
                <textarea
                  value={aiCurrentTools}
                  onChange={(e) => setAiCurrentTools(e.target.value)}
                  placeholder="CRM, email, calendar, accounting software, etc."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontFamily: 'inherit',
                    fontSize: '14px'
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Additional details for proposal?
                </Typography>
                <textarea
                  value={aiAdditionalDetails}
                  onChange={(e) => setAiAdditionalDetails(e.target.value)}
                  placeholder="Budget, timeline, specific requirements..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontFamily: 'inherit',
                    fontSize: '14px'
                  }}
                />
              </Box>
            </Box>
          </>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Additional Notes */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          📝 Additional Notes
        </Typography>
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Tell us about any specific challenges or requirements...
          </Typography>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What business problems are you trying to solve? What's your timeline?"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontFamily: 'inherit',
              fontSize: '14px'
            }}
          />
        </Box>

        {/* Summary */}
        {selected.length > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Selected {selected.length} service(s)</strong>
              {totalEstimate > 0 && (
                <> — Estimated range: ${(totalEstimate / 1000).toFixed(1)}K+</>
              )}
            </Typography>
          </Alert>
        )}

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            onClick={onBack}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            endIcon={<ArrowForward />}
          >
            Continue to Availability
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
