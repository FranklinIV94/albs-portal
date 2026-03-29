'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card, CardContent, Typography, Box, Button, TextField, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, IconButton,
  Paper, Tabs, Tab, Stack, Alert, Checkbox, FormControlLabel, FormGroup, Divider, CircularProgress,
  ThemeProvider, createTheme, CssBaseline
} from '@mui/material';
import { 
  PersonAdd, ContentCopy, Visibility, Edit, CheckCircle,
  Schedule, Payment, Description, Refresh, Save, Delete, Chat,
  CloudUpload, Add, Send, AttachMoney, Settings, TrendingUp, AccountBalance,
  Assignment, Note, History, CheckBox, Flag
} from '@mui/icons-material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import ProgressTracker from '@/components/ProgressTracker';
import ChatPanel from '@/components/ChatPanel';

interface ClientRequest {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Lead {
  id: string;
  token: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
  leadServices?: { service: Service; customPrice?: number }[];
  clientRequests?: ClientRequest[];
}

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  priceDisplay: string;
  basePrice: number;
  icon: string;
  isActive: boolean;
  isCustom?: boolean;
  customServiceName?: string;
}

const STATUSES = ['NEW', 'ONBOARDING', 'CONTRACT', 'PAYMENT', 'ACTIVE', 'WORK_IN_PROGRESS', 'COMPLETE'];

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  NEW: 'default',
  ONBOARDING: 'primary',
  CONTRACT: 'secondary',
  PAYMENT: 'warning',
  ACTIVE: 'success',
  WORK_IN_PROGRESS: 'info',
  COMPLETE: 'error',
};

const CATEGORIES: Record<string, string> = {
  AI_SERVICES: '🤖 AI Services',
  TAX_BUSINESS: '📋 Tax & Business',
  PAYROLL: '💰 Payroll Setup',
  PAYROLL_BOOKKEEPING: '💼 Payroll & Bookkeeping',
  BOOKKEEPING: '📒 Standalone Bookkeeping',
  MARKETING: '📣 Marketing',
  CUSTOM: '🎯 Custom Services',
};

// Glass morphism theme
const glassTheme = {
  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
  cardBg: 'rgba(15,23,42,0.92)',
  cardBorder: 'rgba(99,102,241,0.3)',
  cardGlow: '0 8px 32px rgba(0,0,0,0.4)',
  textPrimary: '#f0f0f8',
  textSecondary: 'rgba(240,240,248,0.75)',
  accentGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  successGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  warningGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  tableBg: 'rgba(10,18,40,0.95)',
  tableHeaderBg: 'rgba(30,41,100,0.9)',
  tableRowHover: 'rgba(99,102,241,0.12)',
  tableRowBorder: 'rgba(99,102,241,0.15)',
};

// Dark theme overrides for MUI components
const darkTheme = {
  palette: {
    mode: 'dark' as const,
    text: {
      primary: '#f0f0f8',
      secondary: 'rgba(240,240,248,0.7)',
      disabled: 'rgba(240,240,248,0.3)',
    },
    action: {
      disabled: 'rgba(240,240,248,0.3)',
      disabledBackground: 'rgba(240,240,248,0.12)',
    },
  },
  components: {
    MuiTab: {
      styleOverrides: {
        root: {
          color: 'rgba(240,240,248,0.6)',
          '&.Mui-selected': {
            color: '#f0f0f8',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#f0f0f8',
        },
        outlined: {
          borderColor: 'rgba(240,240,248,0.3)',
          color: '#f0f0f8',
          '&.Mui-disabled': {
            borderColor: 'rgba(240,240,248,0.3)',
            color: 'rgba(240,240,248,0.3)',
          },
        },
        contained: {
          color: '#fff',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: 'rgba(240,240,248,0.6)',
            '&.Mui-focused': {
              color: '#a5b4fc',
            },
          },
          '& .MuiOutlinedInput-root': {
            color: '#f0f0f8',
            '& input::placeholder': {
              color: 'rgba(240,240,248,0.5)',
              opacity: 1,
            },
            '& fieldset': {
              borderColor: 'rgba(148,163,184,0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(148,163,184,0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366f1',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          '& .MuiTypography-root': {
            color: '#f0f0f8',
          },
          '& .MuiDialogTitle-root': {
            color: '#f0f0f8',
          },
          '& .MuiDialogContentText-root': {
            color: 'rgba(240,240,248,0.7)',
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          color: 'rgba(240,240,248,0.87)',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: 'rgba(240,240,248,0.7)',
          '&.Mui-checked': {
            color: '#6366f1',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          color: '#f0f0f8',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: '#f0f0f8',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: '#f0f0f8',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(255,255,255,0.05)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          color: '#f0f0f8',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          color: '#f0f0f8',
        },
      },
    },
  },
};

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState(0);
  const [newLead, setNewLead] = useState({ firstName: '', lastName: '', email: '', company: '', title: '', phone: '', serviceCategories: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [prepaidDialogOpen, setPrepaidDialogOpen] = useState(false);
  const [prepaidClient, setPrepaidClient] = useState({ firstName: '', lastName: '', email: '', company: '', phone: '' });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [savingServices, setSavingServices] = useState(false);
  const [leadTab, setLeadTab] = useState(0); // 0: Info, 1: Services, 2: Progress, 3: Chat, 4: Client Requests, 5: Billing, 6: Tasks, 7: Notes, 8: Activity
  
  const chatLeadId = searchParams.get('chat');
  
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  
  const [proposeOpen, setProposeOpen] = useState(false);
  const [proposeService, setProposeService] = useState({ name: '', description: '', price: 0, interval: 'MONTHLY' });
  const [proposeSending, setProposeSending] = useState(false);
  
  const [requestDocOpen, setRequestDocOpen] = useState(false);
  const [requestDocMessage, setRequestDocMessage] = useState('');
  const [requestDocSending, setRequestDocSending] = useState(false);

  // Service editing state
  const [servicesTabOpen, setServicesTabOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [servicePriceInput, setServicePriceInput] = useState('');
  const [savingService, setSavingService] = useState(false);

  // Proposal builder state
  const [serviceNotes, setServiceNotes] = useState<Record<string, string>>({});
  const [serviceDiscountTypes, setServiceDiscountTypes] = useState<Record<string, 'FLAT' | 'PERCENT'>>({});
  const [serviceDiscountValues, setServiceDiscountValues] = useState<Record<string, number>>({});
  const [proposalNotes, setProposalNotes] = useState('');
  const [proposalDiscountType, setProposalDiscountType] = useState<'FLAT' | 'PERCENT' | null>(null);
  const [proposalDiscountValue, setProposalDiscountValue] = useState<number>(0);
  const [createProposalOpen, setCreateProposalOpen] = useState(false);
  const [creatingProposal, setCreatingProposal] = useState(false);

  // Custom service state
  const [customServiceOpen, setCustomServiceOpen] = useState(false);
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServicePrice, setCustomServicePrice] = useState('');
  const [customServiceDescription, setCustomServiceDescription] = useState('');
  const [customServices, setCustomServices] = useState<Record<string, any>>({});

  // Tasks, Notes, Activity state
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  
  // Invoice state
  const [invoices, setInvoices] = useState<any[]>([]);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceLineItems, setInvoiceLineItems] = useState<any[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [invoiceTaxRate, setInvoiceTaxRate] = useState(0);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceDueDays, setInvoiceDueDays] = useState(30);
  const [savingInvoice, setSavingInvoice] = useState(false);

  // New task/note form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Proposal builder functions
  const handleServiceNotesChange = (serviceId: string, note: string) => {
    setServiceNotes(prev => ({ ...prev, [serviceId]: note }));
  };

  const handleServiceDiscountTypeChange = (serviceId: string, type: 'FLAT' | 'PERCENT') => {
    setServiceDiscountTypes(prev => ({ ...prev, [serviceId]: type }));
  };

  const handleServiceDiscountValueChange = (serviceId: string, value: number) => {
    setServiceDiscountValues(prev => ({ ...prev, [serviceId]: value }));
  };

  const createProposal = async () => {
    if (!selectedLead || selectedServices.length === 0) {
      alert('Please select at least one service');
      return;
    }

    setCreatingProposal(true);
    try {
      const serviceSelections = selectedServices.map(serviceId => {
        const service = services.find(s => s.id === serviceId);
        const customPrice = customPrices[serviceId] || service?.basePrice || 0;
        return {
          serviceId,
          customPrice,
          discountType: serviceDiscountTypes[serviceId] || null,
          discountValue: serviceDiscountValues[serviceId] || null,
          notes: serviceNotes[serviceId] || null,
        };
      });

      const res = await fetch('/api/admin/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          serviceSelections,
          notes: proposalNotes,
          discountType: proposalDiscountType,
          discountValue: proposalDiscountValue,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Mark as sent
        await fetch('/api/admin/proposals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposalId: data.proposal.id, status: 'SENT' }),
        });

        alert(`Proposal created! Copy this link to send to client:\n${window.location.origin}/onboard/${data.token}`);
        setCreateProposalOpen(false);
        
        // Reset
        setProposalNotes('');
        setProposalDiscountType(null);
        setProposalDiscountValue(0);
        setServiceNotes({});
        setServiceDiscountTypes({});
        setServiceDiscountValues({});
        
        fetchLeads();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Failed to create proposal:', err);
      alert('Failed to create proposal');
    } finally {
      setCreatingProposal(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (dialogOpen && availableServices.length === 0) {
      fetch('/api/services')
        .then(r => r.json())
        .then(data => {
          if (data.services) setAvailableServices(data.services.filter((s: any) => s.isActive));
        })
        .catch(() => {});
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (chatLeadId && leads.length > 0) {
      const lead = leads.find(l => l.id === chatLeadId);
      if (lead) {
        openLeadDetails(lead);
        setLeadTab(3);
      }
    }
  }, [chatLeadId, leads]);

  useEffect(() => {
    if (tab === 3) {
      fetchAllInvoices();
    }
  }, [tab]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (!data.authenticated) {
        router.push('/admin/login');
      } else {
        setCheckingAuth(false);
        fetchLeads();
      }
    } catch (err) {
      router.push('/admin/login');
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads');
      const data = await res.json();
      setLeads(data.leads || []);
      setServices(data.services || []);
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async (leadId: string) => {
    setLoadingSubscriptions(true);
    try {
      const res = await fetch(`/api/stripe/subscription?leadId=${leadId}`);
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const fetchInvoices = async (leadId: string) => {
    setLoadingInvoices(true);
    try {
      const res = await fetch(`/api/invoices?leadId=${leadId}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchAllInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await fetch('/api/invoices?limit=100');
      const data = await res.json();
      setAllInvoices(data.invoices || []);
    } catch (err) {
      console.error('Failed to fetch all invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchTasks = async (leadId: string) => {
    setLoadingTasks(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/tasks`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchNotes = async (leadId: string) => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/notes`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchActivity = async (leadId: string) => {
    setLoadingActivity(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/activity`);
      const data = await res.json();
      setActivityLogs(data.activities || []);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const handleProposeService = async () => {
    if (!selectedLead || !proposeService.name || !proposeService.price) return;
    setProposeSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          serviceName: proposeService.name,
          serviceDescription: proposeService.description,
          price: proposeService.price,
          interval: proposeService.interval,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Service proposal sent to client!');
        setProposeOpen(false);
        setProposeService({ name: '', description: '', price: 0, interval: 'MONTHLY' });
      } else {
        alert(data.error || 'Failed to send proposal');
      }
    } catch (err) {
      console.error('Failed to propose service:', err);
    } finally {
      setProposeSending(false);
    }
  };

  const handleRequestDocuments = async () => {
    if (!selectedLead || !requestDocMessage.trim()) return;
    setRequestDocSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          content: `DOCUMENT REQUEST: ${requestDocMessage}`,
          isAdmin: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Document request sent to client!');
        setRequestDocOpen(false);
        setRequestDocMessage('');
      } else {
        alert(data.error || 'Failed to send request');
      }
    } catch (err) {
      console.error('Failed to request documents:', err);
    } finally {
      setRequestDocSending(false);
    }
  };

  const replyToClientRequest = async (requestId: string, reply: string) => {
    if (!reply.trim()) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead?.id,
          content: `REPLY: ${reply}`,
          isAdmin: true,
          clientRequestId: requestId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Reply sent to client!');
        fetchLeads(); // Refresh to get updated data
      }
    } catch (err) {
      console.error('Failed to reply:', err);
    }
  };

  const saveServiceBasePrice = async () => {
    if (!editingService || !servicePriceInput) return;
    setSavingService(true);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: editingService.id,
          basePrice: Math.round(parseFloat(servicePriceInput) * 100),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Service price updated!');
        setEditingService(null);
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to update service:', err);
    } finally {
      setSavingService(false);
    }
  };

  const createLead = async () => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLead, serviceIds: selectedServiceIds }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads([data.lead, ...leads]);
        setDialogOpen(false);
        setNewLead({ firstName: '', lastName: '', email: '', company: '', title: '', phone: '', serviceCategories: '' });
        setSelectedServiceIds([]);
        const onboardLink = `${window.location.origin}/onboard/${data.token}`;
        const emailSent = data.emailResult?.success;
        alert(
          `Lead created!${emailSent ? ' ✅ Welcome email sent automatically.' : ''}\n\nOnboarding link: ${onboardLink}`
        );
      }
    } catch (err) {
      console.error('Failed to create lead:', err);
    }
  };

  // Create pre-paid client (skips onboarding, goes directly to portal)
  const createPrepaidClient = async () => {
    if (!prepaidClient.firstName || !prepaidClient.email) {
      alert('Please enter at least first name and email');
      return;
    }
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prepaidClient,
          status: 'ACTIVE',
          onboardingCompleted: true,
          onboardingStep: 5,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads([data.lead, ...leads]);
        setPrepaidDialogOpen(false);
        setPrepaidClient({ firstName: '', lastName: '', email: '', company: '', phone: '' });
        alert(`Pre-paid client created! Portal link: ${window.location.origin}/client/${data.token}`);
      }
    } catch (err) {
      console.error('Failed to create prepaid client:', err);
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status }),
      });
      fetchLeads();
    } catch (err) {
      console.error('Failed to update lead:', err);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/leads?leadId=${leadId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setLeads(leads.filter(l => l.id !== leadId));
      } else {
        alert('Failed to delete lead: ' + data.error);
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    const currentServiceIds = lead.leadServices?.map(ls => ls.service.id) || [];
    setSelectedServices(currentServiceIds);
    
    const prices: Record<string, number> = {};
    lead.leadServices?.forEach(ls => {
      const anyLeadService = ls as any;
      if (anyLeadService.customPrice) {
        prices[ls.service.id] = anyLeadService.customPrice;
      }
    });
    setCustomPrices(prices);
    
    setViewDialogOpen(true);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const saveLeadServices = async () => {
    if (!selectedLead) return;
    setSavingServices(true);
    try {
      const res = await fetch('/api/admin/leads/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          serviceIds: selectedServices,
          customPrices: customPrices,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setViewDialogOpen(false);
        fetchLeads();
      } else {
        alert('Failed to save: ' + data.error);
      }
    } catch (err) {
      console.error('Failed to save services:', err);
    } finally {
      setSavingServices(false);
    }
  };

  const copyOnboardLink = (token: string) => {
    const url = `${window.location.origin}/onboard/${token}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const getStatusCount = (status: string) => leads.filter(l => l.status === status).length;

  // Merge custom services with regular services
  const allServices = [...services, ...Object.values(customServices)];
  const groupedServices = allServices.reduce((acc, s) => {
    const cat = s.category || 'CUSTOM';
    if (!acc[cat]) acc[cat] = [] as Service[];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, Service[]>);

  if (checkingAuth) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', background: glassTheme.background, minHeight: '100vh' }}>
        <Typography sx={{ color: glassTheme.textPrimary }}>Checking authentication...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 4, 
      maxWidth: 1600, 
      mx: 'auto', 
      background: glassTheme.background, 
      minHeight: '100vh',
      backgroundAttachment: 'fixed',
    }}>
      {/* Header with gradient */}
      <Box sx={{ 
        mb: 4, 
        p: 3, 
        borderRadius: 3,
        background: glassTheme.cardBg,
        border: `1px solid ${glassTheme.cardBorder}`,
        boxShadow: glassTheme.cardGlow,
        backdropFilter: 'none',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" fontWeight="bold" sx={{
              background: glassTheme.accentGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              ALBS Client Portal
            </Typography>
            <Typography variant="body2" sx={{ color: glassTheme.textSecondary, mt: 0.5 }}>
              Manage clients, services, and billing
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setServicesTabOpen(true)}
              size="small"
              sx={{ 
                borderColor: glassTheme.cardBorder, 
                color: glassTheme.textPrimary,
                '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.1)' },
                borderRadius: 2,
              }}
            >
              Manage Services
            </Button>
            <Button 
              variant="contained" 
              startIcon={<PersonAdd />} 
              onClick={() => setDialogOpen(true)}
              size="small"
              sx={{ 
                background: glassTheme.accentGradient,
                fontWeight: 'bold',
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                '&:hover': { boxShadow: '0 6px 20px rgba(99,102,241,0.5)' },
              }}
            >
              New Lead
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<CheckCircle />}
              onClick={() => setPrepaidDialogOpen(true)}
              size="small"
              sx={{ 
                borderColor: '#10b981',
                color: '#10b981',
                borderRadius: 2,
                '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' },
              }}
            >
              Pre-Paid Client
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Status Summary with glass morphism */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: 2, 
        mb: 4, 
      }}>
        {STATUSES.map((status, idx) => (
          <Box key={status} sx={{
            p: 2,
            borderRadius: 2,
            background: glassTheme.cardBg,
            border: `1px solid ${glassTheme.cardBorder}`,
            boxShadow: glassTheme.cardGlow,
            backdropFilter: 'none',
            textAlign: 'center',
          }}>
            <Typography variant="h4" fontWeight="bold" sx={{ 
              color: idx % 2 === 0 ? '#6366f1' : '#8b5cf6',
              textShadow: '0 0 20px rgba(99,102,241,0.5)',
            }}>
              {getStatusCount(status)}
            </Typography>
            <Typography variant="caption" sx={{ color: glassTheme.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
              {status.replace(/_/g, ' ')}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTab-root': { color: glassTheme.textSecondary },
            '& .Mui-selected': { color: '#6366f1' },
            '& .MuiTabs-indicator': { background: '#6366f1' },
          }}
        >
          <Tab label={`All Leads (${leads.length})`} />
          <Tab label="AI Services" />
          <Tab label="Payroll" />
          <Tab label="📋 All Invoices" />
          {analytics && <Tab label="📊 Analytics" />}
        </Tabs>
      </Box>

      {/* All Invoices Tab (tab === 3) */}
      {tab === 3 && (
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: glassTheme.textPrimary }}>
              📋 All Issued Invoices
            </Typography>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchAllInvoices}
              size="small"
            >
              Refresh
            </Button>
          </Box>

          {loadingInvoices ? (
            <Typography sx={{ color: glassTheme.textSecondary }}>Loading invoices...</Typography>
          ) : allInvoices.length > 0 ? (
            <TableContainer component={Paper} sx={{ bgcolor: glassTheme.tableBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: glassTheme.tableHeaderBg }}>
                    <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Invoice #</TableCell>
                    <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Client</TableCell>
                    <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Amount</TableCell>
                    <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Status</TableCell>
                    <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Issued</TableCell>
                    <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Due</TableCell>
                    <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allInvoices.map((inv: any) => (
                    <TableRow key={inv.id} sx={{ '&:hover': { bgcolor: glassTheme.tableRowHover }, borderBottom: `1px solid ${glassTheme.tableRowBorder}` }}>
                      <TableCell sx={{ color: glassTheme.textPrimary }}>{inv.invoiceNumber}</TableCell>
                      <TableCell sx={{ color: glassTheme.textPrimary }}>
                        <Typography variant="body2" fontWeight={500}>{inv.clientName}</Typography>
                        {inv.lead?.company && <Typography variant="caption" sx={{ color: glassTheme.textSecondary }}>{inv.lead.company}</Typography>}
                      </TableCell>
                      <TableCell sx={{ color: '#10b981', fontWeight: 600 }}>${(inv.total / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={inv.status} 
                          size="small" 
                          color={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'error' : 'warning'} 
                        />
                      </TableCell>
                      <TableCell sx={{ color: glassTheme.textSecondary }}>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ color: glassTheme.textSecondary }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        {inv.status !== 'PAID' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/invoices/checkout', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ invoiceId: inv.id, sendEmail: true }),
                                });
                                const data = await res.json();
                                if (data.paymentUrl) {
                                  window.open(data.paymentUrl, '_blank');
                                  navigator.clipboard.writeText(data.paymentUrl);
                                  alert('Payment link sent!');
                                }
                              } catch (err) {
                                console.error('Checkout error:', err);
                              }
                            }}
                            sx={{ fontSize: '11px', py: 0.3 }}
                          >
                            Send Link
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}` }}>
              <Typography sx={{ color: glassTheme.textSecondary }}>No invoices issued yet.</Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Analytics Tab (tab >= 4) */}
      {tab >= 4 && analytics ? (
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ color: glassTheme.textPrimary, mb: 3 }}>
            📊 Analytics Dashboard
          </Typography>
          
          {/* Revenue Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: glassTheme.textSecondary }}>Total Revenue</Typography>
                <Typography variant="h4" sx={{ color: '#10b981' }}>${(analytics?.revenue?.thisMonth || 0).toLocaleString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: glassTheme.textSecondary }}>Avg per Client</Typography>
                <Typography variant="h4" sx={{ color: '#6366f1' }}>${analytics?.activeClients ? Math.round(analytics.revenue?.thisMonth / analytics.activeClients / 100) : 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: glassTheme.textSecondary }}>Active Clients</Typography>
                <Typography variant="h4" sx={{ color: '#f59e0b' }}>{analytics?.activeClients || 0}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, bgcolor: glassTheme.cardBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ color: glassTheme.textSecondary }}>Target</Typography>
                <Typography variant="h4" sx={{ color: '#ec4899' }}>$35K</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Payouts Section */}
          <Typography variant="h6" sx={{ color: glassTheme.textPrimary, mb: 2 }}>Recent Payouts</Typography>
          <TableContainer component={Paper} sx={{ bgcolor: glassTheme.tableBg, border: `1px solid ${glassTheme.cardBorder}`, borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: glassTheme.tableHeaderBg }}>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics.stripePayouts?.length > 0 ? (
                  analytics.stripePayouts.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell sx={{ color: glassTheme.textPrimary }}>${(p.amount / 100).toFixed(2)}</TableCell>
                      <TableCell><Chip label={p.status} size="small" color={p.status === 'paid' ? 'success' : 'warning'} /></TableCell>
                      <TableCell sx={{ color: glassTheme.textPrimary }}>{new Date(p.created * 1000).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ color: glassTheme.textSecondary, textAlign: 'center' }}>No payouts available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : null}

      {/* Lead Table (tabs 0-2) */}
      {tab <= 2 && (
      <TableContainer component={Paper} sx={{ 
        bgcolor: glassTheme.tableBg, 
        border: `1px solid ${glassTheme.cardBorder}`,
        borderRadius: 2,
        boxShadow: glassTheme.cardGlow,
        backdropFilter: 'none',
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: glassTheme.tableHeaderBg }}>
              <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Name</TableCell>
              <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Company</TableCell>
              <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Email</TableCell>
              <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Services</TableCell>
              <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Status</TableCell>
              <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Created</TableCell>
              <TableCell sx={{ color: glassTheme.textPrimary, fontWeight: 600, borderBottom: `2px solid ${glassTheme.cardBorder}` }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.filter(l => {
              if (tab === 1) return l.leadServices?.some((s: any) => s.service.name.includes('AI'));
              if (tab === 2) return l.leadServices?.some((s: any) => ['Tax', 'Payroll'].some((t: string) => s.service.name.includes(t)));
              return true;
            }).map((lead: any) => (
              <TableRow key={lead.id} sx={{ 
                '&:hover': { bgcolor: glassTheme.tableRowHover }, 
                borderBottom: `1px solid ${glassTheme.tableRowBorder}`,
                transition: 'background 0.2s',
              }}>
                <TableCell sx={{ color: glassTheme.textPrimary }}>{lead.firstName} {lead.lastName}</TableCell>
                <TableCell sx={{ color: glassTheme.textPrimary }}>{lead.company || '-'}</TableCell>
                <TableCell sx={{ color: glassTheme.textPrimary }}>{lead.email || '-'}</TableCell>
                <TableCell>
                  {lead.leadServices?.map((s: any) => (
                    <Chip 
                      key={s.service.id} 
                      size="small" 
                      icon={<span>{s.service.icon}</span>} 
                      label={s.service.name} 
                      sx={{ mr: 0.5, mb: 0.5, bgcolor: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }} 
                    />
                  )) || <Typography variant="caption" sx={{ color: glassTheme.textSecondary }}>No services</Typography>}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={lead.status.replace(/_/g, ' ')} 
                    color={STATUS_COLORS[lead.status] || 'default'} 
                    size="small"
                    onClick={() => {
                      const current = STATUSES.indexOf(lead.status);
                      const next = STATUSES[(current + 1) % STATUSES.length];
                      updateLeadStatus(lead.id, next);
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell sx={{ color: glassTheme.textPrimary }}>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => copyOnboardLink(lead.token)} sx={{ color: glassTheme.textPrimary }}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => openLeadDetails(lead)} sx={{ color: glassTheme.textPrimary }}>
                    <Visibility fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteLead(lead.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography sx={{ color: glassTheme.textSecondary }}>No leads yet. Create your first lead!</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      {/* New Lead Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            bgcolor: 'rgba(15,23,42,1)', 
            border: `1px solid ${glassTheme.cardBorder}`, 
            color: glassTheme.textPrimary,
            backdropFilter: 'none',
          }
        }}
      >
        <DialogTitle sx={{ color: '#f0f0f8', borderBottom: `1px solid ${glassTheme.cardBorder}`, py: 2 }}>
          Create New Lead
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2.5}>
            <TextField 
              label="First Name" 
              fullWidth 
              value={newLead.firstName} 
              onChange={e => setNewLead({...newLead, firstName: e.target.value})}
              InputLabelProps={{ sx: { color: '#94a3b8' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#f0f0f8',
                  bgcolor: 'rgba(30,41,59,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8', '&.Mui-focused': { color: '#a5b4fc' } },
              }}
            />
            <TextField 
              label="Last Name" 
              fullWidth 
              value={newLead.lastName} 
              onChange={e => setNewLead({...newLead, lastName: e.target.value})}
              InputLabelProps={{ sx: { color: '#94a3b8' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#f0f0f8',
                  bgcolor: 'rgba(30,41,59,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8', '&.Mui-focused': { color: '#a5b4fc' } },
              }}
            />
            <TextField 
              label="Email" 
              fullWidth 
              type="email"
              value={newLead.email} 
              onChange={e => setNewLead({...newLead, email: e.target.value})}
              InputLabelProps={{ sx: { color: '#94a3b8' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#f0f0f8',
                  bgcolor: 'rgba(30,41,59,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8', '&.Mui-focused': { color: '#a5b4fc' } },
              }}
            />
            <TextField 
              label="Company" 
              fullWidth 
              value={newLead.company} 
              onChange={e => setNewLead({...newLead, company: e.target.value})}
              InputLabelProps={{ sx: { color: '#94a3b8' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#f0f0f8',
                  bgcolor: 'rgba(30,41,59,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8', '&.Mui-focused': { color: '#a5b4fc' } },
              }}
            />
            <TextField 
              label="Title" 
              fullWidth 
              value={newLead.title} 
              onChange={e => setNewLead({...newLead, title: e.target.value})}
              InputLabelProps={{ sx: { color: '#94a3b8' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#f0f0f8',
                  bgcolor: 'rgba(30,41,59,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8', '&.Mui-focused': { color: '#a5b4fc' } },
              }}
            />
            <TextField 
              label="Phone" 
              fullWidth 
              value={newLead.phone} 
              onChange={e => setNewLead({...newLead, phone: e.target.value})}
              InputLabelProps={{ sx: { color: '#94a3b8' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#f0f0f8',
                  bgcolor: 'rgba(30,41,59,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8', '&.Mui-focused': { color: '#a5b4fc' } },
              }}
            />
            
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: glassTheme.textPrimary }}>
                Limit Service Categories (leave empty for all)
              </Typography>
              <FormGroup row>
                {['AI_SERVICES', 'TAX_BUSINESS', 'PAYROLL_BOOKKEEPING', 'MARKETING'].map(cat => (
                  <FormControlLabel
                    key={cat}
                    control={
                      <Checkbox
                        checked={newLead.serviceCategories?.includes(cat) || false}
                        onChange={(e) => {
                          const cats = newLead.serviceCategories ? newLead.serviceCategories.split(',').map(c => c.trim()) : [];
                          if (e.target.checked) {
                            cats.push(cat);
                          } else {
                            const idx = cats.indexOf(cat);
                            if (idx > -1) cats.splice(idx, 1);
                          }
                          setNewLead({ ...newLead, serviceCategories: cats.join(',') });
                        }}
                        sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#6366f1' } }}
                      />
                    }
                    label={<span style={{ color: '#cbd5e1' }}>{cat.replace('_', ' ')}</span>}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Services selector */}
            <Box>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                Assign Services (optional)
              </Typography>
              <Box sx={{ maxHeight: 200, overflowY: 'auto', bgcolor: 'rgba(30,41,59,0.8)', borderRadius: 1, p: 1, border: '1px solid rgba(148,163,184,0.3)' }}>
                {availableServices.length === 0 ? (
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Loading services...</Typography>
                ) : (
                  availableServices.map(service => (
                    <FormControlLabel
                      key={service.id}
                      control={
                        <Checkbox
                          checked={selectedServiceIds.includes(service.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedServiceIds([...selectedServiceIds, service.id]);
                            } else {
                              setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id));
                            }
                          }}
                          size="small"
                          sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#6366f1' } }}
                        />
                      }
                      label={<span style={{ color: '#cbd5e1', fontSize: 13 }}>{service.icon} {service.name} — {service.priceDisplay}</span>}
                    />
                  ))
                )}
              </Box>
              {selectedServiceIds.length > 0 && (
                <Typography variant="caption" sx={{ color: '#6366f1', mt: 0.5, display: 'block' }}>
                  {selectedServiceIds.length} service(s) selected
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${glassTheme.cardBorder}`, py: 2, px: 3 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={createLead}
            sx={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              fontWeight: 'bold',
              '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
            }}
          >
            Create Lead
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pre-Paid Client Dialog */}
      <Dialog 
        open={prepaidDialogOpen} 
        onClose={() => setPrepaidDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            bgcolor: 'rgba(15,23,42,1)', 
            border: `1px solid ${glassTheme.cardBorder}`, 
            color: glassTheme.textPrimary,
            backdropFilter: 'none',
          }
        }}
      >
        <DialogTitle sx={{ color: '#10b981', borderBottom: `1px solid ${glassTheme.cardBorder}`, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle />
            Create Pre-Paid Client
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a client who has already paid externally. They'll get instant portal access (no onboarding) to track progress and use chat.
          </Typography>
          <Stack spacing={2}>
            <TextField 
              label="First Name" 
              fullWidth 
              value={prepaidClient.firstName} 
              onChange={e => setPrepaidClient({...prepaidClient, firstName: e.target.value})}
              InputLabelProps={{ sx: { color: '#94a3b8' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#f0f0f8',
                  bgcolor: 'rgba(30,41,59,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#10b981' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8', '&.Mui-focused': { color: '#34d399' } },
              }}
            />
            <TextField 
              label="Last Name" 
              fullWidth 
              value={prepaidClient.lastName} 
              onChange={e => setPrepaidClient({...prepaidClient, lastName: e.target.value})}
              InputLabelProps={{ sx: { color: '#94a3b8' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#f0f0f8',
                  bgcolor: 'rgba(30,41,59,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#10b981' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8', '&.Mui-focused': { color: '#34d399' } },
              }}
            />
            <TextField 
              label="Email" 
              fullWidth 
              type="email"
              value={prepaidClient.email} 
              onChange={e => setPrepaidClient({...prepaidClient, email: e.target.value})}
              InputLabelProps={{ sx: { color: '#94a3b8' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#f0f0f8',
                  bgcolor: 'rgba(30,41,59,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#10b981' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8', '&.Mui-focused': { color: '#34d399' } },
              }}
            />
            <TextField 
              label="Company" 
              fullWidth 
              value={prepaidClient.company} 
              onChange={e => setPrepaidClient({...prepaidClient, company: e.target.value})}
              InputLabelProps={{ sx: { color: '#94a3b8' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#f0f0f8',
                  bgcolor: 'rgba(30,41,59,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#10b981' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8', '&.Mui-focused': { color: '#34d399' } },
              }}
            />
            <TextField 
              label="Phone" 
              fullWidth 
              value={prepaidClient.phone} 
              onChange={e => setPrepaidClient({...prepaidClient, phone: e.target.value})}
              InputLabelProps={{ sx: { color: '#94a3b8' } }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#f0f0f8',
                  bgcolor: 'rgba(30,41,59,0.8)',
                  '& fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#10b981' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8', '&.Mui-focused': { color: '#34d399' } },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPrepaidDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={createPrepaidClient}
            sx={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              fontWeight: 'bold',
              '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
            }}
          >
            Create & Get Portal Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Services Tab Dialog - For editing service base prices */}
      <Dialog 
        open={servicesTabOpen} 
        onClose={() => setServicesTabOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { 
            bgcolor: 'rgba(15,23,42,1)', 
            border: `1px solid ${glassTheme.cardBorder}`, 
            color: glassTheme.textPrimary,
            backdropFilter: 'none',
          }
        }}
      >
        <DialogTitle sx={{ background: glassTheme.accentGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Manage Service Prices
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: glassTheme.textSecondary, mb: 2 }}>
            Edit base prices for services in the catalog. These prices apply to all new clients.
          </Typography>
          
          {(Object.entries(groupedServices) as [string, Service[]][]).map(([category, categoryServices]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#8b5cf6', mb: 1 }}>
                {CATEGORIES[category] || category}
              </Typography>
              <Stack spacing={1}>
                {categoryServices.map(service => (
                  <Paper 
                    key={service.id}
                    sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${glassTheme.cardBorder}`,
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{ fontSize: '1.5rem' }}>{service.icon}</span>
                      <Box>
                        <Typography fontWeight="bold" sx={{ color: '#ffffff' }}>{service.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
                          {service.description.substring(0, 60)}...
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={`$${(service.basePrice / 100).toFixed(2)}`} 
                        size="small" 
                        sx={{ bgcolor: '#10b981', color: '#ffffff', fontWeight: 'bold' }}
                      />
                      <Button 
                        size="small" 
                        startIcon={<Edit fontSize="small" />}
                        onClick={() => {
                          setEditingService(service);
                          setServicePriceInput((service.basePrice / 100).toFixed(2));
                        }}
                        sx={{ color: glassTheme.textSecondary }}
                      >
                        Edit
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServicesTabOpen(false)} sx={{ color: glassTheme.textSecondary }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Service Price Dialog */}
      <Dialog 
        open={!!editingService} 
        onClose={() => setEditingService(null)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            bgcolor: 'rgba(15,23,42,1)', 
            border: `1px solid ${glassTheme.cardBorder}`, 
            color: glassTheme.textPrimary,
          }
        }}
      >
        <DialogTitle>Edit Service Price</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {editingService?.name} - Current: ${editingService ? (editingService.basePrice / 100).toFixed(2) : '0.00'}
          </Typography>
          <TextField
            label="New Price ($)"
            fullWidth
            type="number"
            value={servicePriceInput}
            onChange={(e) => setServicePriceInput(e.target.value)}
            InputProps={{ 
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingService(null)} sx={{ color: glassTheme.textSecondary }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={saveServiceBasePrice}
            disabled={savingService}
          >
            {savingService ? 'Saving...' : 'Save Price'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lead Details Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { 
            bgcolor: 'rgba(15,23,42,1)', 
            border: `1px solid ${glassTheme.cardBorder}`, 
            color: glassTheme.textPrimary, 
            minHeight: '60vh',
            backdropFilter: 'none',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: glassTheme.accentGradient, 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          borderBottom: `1px solid ${glassTheme.cardBorder}`,
          pb: 2,
        }}>
          {selectedLead?.firstName} {selectedLead?.lastName}
        </DialogTitle>
        <DialogContent>
          {selectedLead && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Tabs
                value={leadTab}
                onChange={(_, v) => {
                  setLeadTab(v);
                  if (v === 5 && selectedLead) {
                    fetchSubscriptions(selectedLead.id);
                    fetchInvoices(selectedLead.id); // FIX: also fetch invoices when opening billing tab
                  }
                  // Fetch data for new tabs
                  if (v === 6 && selectedLead) fetchTasks(selectedLead.id);
                  if (v === 7 && selectedLead) fetchNotes(selectedLead.id);
                  if (v === 8 && selectedLead) fetchActivity(selectedLead.id);
                }}
                sx={{ mb: 2 }}
              >
                <Tab label="Info" />
                <Tab label="Services" />
                <Tab label="Progress" />
                <Tab label="Chat" />
                <Tab label="Client Requests" />
                <Tab label="Billing" />
                <Tab label="Tasks" />
                <Tab label="Notes" />
                <Tab label="Activity" />
              </Tabs>

              {/* Tab 0: Contact Info */}
              {leadTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#8b5cf6' }}>Contact Information</Typography>
                  <Typography><strong>Email:</strong> {selectedLead.email || '-'}</Typography>
                  <Typography><strong>Company:</strong> {selectedLead.company || '-'}</Typography>
                  <Typography><strong>Title:</strong> {selectedLead.title || '-'}</Typography>
                  <Typography><strong>Phone:</strong> {selectedLead.phone || '-'}</Typography>
                  <Typography><strong>Status:</strong> <Chip label={selectedLead.status.replace(/_/g, ' ')} size="small" color={STATUS_COLORS[selectedLead.status] as any} /></Typography>
                  <Typography><strong>Created:</strong> {new Date(selectedLead.createdAt).toLocaleString()}</Typography>
                  
                  <Divider sx={{ my: 2, borderColor: glassTheme.cardBorder }} />
                  
                  <Typography variant="h6" gutterBottom sx={{ color: '#8b5cf6' }}>Quick Actions</Typography>
                  <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Button variant="outlined" startIcon={<Chat />} onClick={() => setLeadTab(3)} sx={{ borderColor: glassTheme.cardBorder, color: glassTheme.textPrimary }}>
                      Open Chat
                    </Button>
                    <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => setRequestDocOpen(true)} sx={{ borderColor: glassTheme.cardBorder, color: glassTheme.textPrimary }}>
                      Request Documents
                    </Button>
                    <Button variant="outlined" startIcon={<Description />} onClick={() => setLeadTab(4)} sx={{ borderColor: glassTheme.cardBorder, color: glassTheme.textPrimary }}>
                      Client Requests
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Tab 1: Services */}
              {leadTab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#8b5cf6' }}>
                      Assigned Services
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        startIcon={<Description />} 
                        onClick={() => setCreateProposalOpen(true)}
                        disabled={selectedServices.length === 0}
                        sx={{ borderColor: '#10b981', color: '#10b981' }}
                      >
                        Create Proposal
                      </Button>
                      <Button variant="contained" startIcon={<Add />} onClick={() => setProposeOpen(true)} size="small">
                        Propose New Service
                      </Button>
                      <Button 
                        variant="outlined" 
                        startIcon={<Settings />} 
                        onClick={() => setCustomServiceOpen(true)} 
                        size="small"
                        sx={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                      >
                        Custom Service
                      </Button>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select services, customize pricing, add notes for the client, then create a proposal.
                  </Typography>

                  {(Object.entries(groupedServices) as [string, Service[]][]).map(([category, categoryServices]) => (
                    <Box key={category} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#6366f1', mb: 1 }}>
                        {CATEGORIES[category] || category}
                      </Typography>
                      <Stack spacing={1}>
                        {categoryServices.map(service => (
                          <Paper 
                            key={service.id}
                            variant="outlined"
                            sx={{ 
                              p: 2, 
                              borderColor: selectedServices.includes(service.id) ? '#6366f1' : 'divider',
                              bgcolor: selectedServices.includes(service.id) ? 'rgba(99,102,241,0.1)' : 'transparent',
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox 
                                  checked={selectedServices.includes(service.id)}
                                  onChange={() => toggleService(service.id)}
                                />
                              }
                              label={
                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                    <Typography fontWeight="bold">
                                      {service.icon} {service.name}
                                    </Typography>
                                    {selectedServices.includes(service.id) ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#cbd5e1' }}>Custom:</Typography>
                                        <TextField
                                          size="small"
                                          type="number"
                                          placeholder={service.basePrice ? (service.basePrice / 100).toFixed(2) : '0.00'}
                                          value={customPrices[service.id] ? (customPrices[service.id] / 100).toFixed(2) : ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const cents = val ? Math.round(parseFloat(val) * 100) : null;
                                            setCustomPrices(prev => ({
                                              ...prev,
                                              [service.id]: cents || 0,
                                            }));
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          sx={{ width: 100 }}
                                          InputProps={{ 
                                            startAdornment: <Typography sx={{ mr: 0.5, color: '#fff' }}>$</Typography>,
                                            sx: { color: '#fff' }
                                          }}
                                        />
                                      </Box>
                                    ) : (
                                      <Chip 
                                        label={service.priceDisplay} 
                                        size="small" 
                                        sx={{ bgcolor: '#10b981', color: '#ffffff', fontWeight: 'bold' }}
                                      />
                                    )}
                                  </Box>
                                  <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                                    {service.description}
                                  </Typography>
                                </Box>
                              }
                              sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                            />
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Tab 2: Progress Tracker */}
              {leadTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#8b5cf6' }}>Onboarding Progress</Typography>
                  <ProgressTracker leadId={selectedLead.id} />
                </Box>
              )}

              {/* Tab 3: Chat */}
              {leadTab === 3 && (
                <Box sx={{ height: 400 }}>
                  <ChatPanel leadId={selectedLead.id} isAdmin />
                </Box>
              )}

              {/* Tab 4: Client Requests */}
              {leadTab === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#8b5cf6' }}>Client Requests</Typography>
                  {selectedLead.clientRequests && selectedLead.clientRequests.length > 0 ? (
                    <Stack spacing={2}>
                      {selectedLead.clientRequests.map((req) => (
                        <Paper 
                          key={req.id}
                          sx={{ 
                            p: 2, 
                            bgcolor: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${glassTheme.cardBorder}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography fontWeight="bold">{req.subject}</Typography>
                            <Chip 
                              label={req.status} 
                              size="small" 
                              color={req.status === 'RESOLVED' ? 'success' : 'warning'}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ color: glassTheme.textSecondary, mb: 2 }}>
                            {req.message}
                          </Typography>
                          <Typography variant="caption" sx={{ color: glassTheme.textSecondary }}>
                            {new Date(req.createdAt).toLocaleString()}
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <ReplyToRequest requestId={req.id} />
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info">
                      No client requests yet. Clients can submit requests through their portal.
                    </Alert>
                  )}
                </Box>
              )}

              {/* Tab 5: Billing */}
              {leadTab === 5 && selectedLead && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#8b5cf6' }}>Billing & Invoices</Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => {
                        setInvoiceLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
                        setInvoiceTaxRate(0);
                        setInvoiceNotes('');
                        setInvoiceDueDays(30);
                        fetchInvoices(selectedLead.id);
                        setInvoiceDialogOpen(true);
                      }}
                      sx={{ background: glassTheme.accentGradient }}
                    >
                      Create Invoice
                    </Button>
                  </Box>
                  
                  {/* Subscriptions */}
                  <Typography variant="subtitle2" gutterBottom sx={{ color: glassTheme.textSecondary }}>Subscriptions</Typography>
                  {loadingSubscriptions ? (
                    <Typography>Loading...</Typography>
                  ) : subscriptions.length > 0 ? (
                    <Stack spacing={2} sx={{ mb: 4 }}>
                      {subscriptions.map(sub => (
                        <Paper key={sub.id} variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {sub.interval === 'MONTHLY' ? 'Monthly' : 'Yearly'} Subscription
                            </Typography>
                            <Chip 
                              label={sub.status} 
                              color={sub.status === 'ACTIVE' ? 'success' : sub.status === 'CANCELED' ? 'error' : 'warning'}
                              size="small" 
                            />
                          </Box>
                          <Typography>
                            <strong>Amount:</strong> ${(sub.amount / 100).toFixed(2)}/{sub.interval === 'MONTHLY' ? 'mo' : 'yr'}
                          </Typography>
                          <Typography>
                            <strong>Period:</strong> {new Date(sub.currentPeriodStart).toLocaleDateString()} - {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info" sx={{ mb: 4 }}>
                      No active subscriptions.
                    </Alert>
                  )}
                  
                  {/* Invoices */}
                  <Typography variant="subtitle2" gutterBottom sx={{ color: glassTheme.textSecondary }}>Invoices</Typography>
                  {loadingInvoices ? (
                    <Typography>Loading...</Typography>
                  ) : invoices.length > 0 ? (
                    <Stack spacing={2}>
                      {invoices.map(inv => (
                        <Paper key={inv.id} variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {inv.invoiceNumber}
                            </Typography>
                            <Chip 
                              label={inv.status} 
                              color={inv.status === 'PAID' ? 'success' : inv.status === 'OVERDUE' ? 'error' : 'default'}
                              size="small" 
                            />
                          </Box>
                          <Typography>
                            <strong>Total:</strong> ${(inv.total / 100).toFixed(2)}
                          </Typography>
                          <Typography>
                            <strong>Issued:</strong> {new Date(inv.issueDate).toLocaleDateString()}
                          </Typography>
                          {inv.dueDate && (
                            <Typography>
                              <strong>Due:</strong> {new Date(inv.dueDate).toLocaleDateString()}
                            </Typography>
                          )}
                          {inv.status !== 'PAID' && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/invoices/checkout', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ invoiceId: inv.id, sendEmail: true }),
                                    });
                                    const data = await res.json();
                                    if (data.paymentUrl) {
                                      // Open Stripe checkout in new tab
                                      window.open(data.paymentUrl, '_blank');
                                      // Also copy to clipboard
                                      navigator.clipboard.writeText(data.paymentUrl);
                                      alert('Payment link created and copied to clipboard!');
                                    } else {
                                      alert('Error: ' + (data.error || 'Failed to create payment link'));
                                    }
                                  } catch (err) {
                                    console.error('Checkout error:', err);
                                    alert('Failed to create payment link');
                                  }
                                }}
                                sx={{ fontSize: '12px', py: 0.5 }}
                              >
                                Send Payment Link
                              </Button>
                            </Box>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info">
                      No invoices yet. Click "Create Invoice" to send one.
                    </Alert>
                  )}
                </Box>
              )}

              {/* Tab 6: Tasks */}
              {leadTab === 6 && selectedLead && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#8b5cf6' }}>Tasks</Typography>
                  
                  {/* Add New Task */}
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Add New Task</Typography>
                    <Stack spacing={2}>
                      <TextField
                        label="Task Title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label="Description (optional)"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                      />
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel>Priority</InputLabel>
                          <Select
                            value={newTaskPriority}
                            label="Priority"
                            onChange={(e) => setNewTaskPriority(e.target.value as any)}
                          >
                            <MenuItem value="LOW"><Chip label="LOW" size="small" color="default" /></MenuItem>
                            <MenuItem value="MEDIUM"><Chip label="MEDIUM" size="small" color="info" /></MenuItem>
                            <MenuItem value="HIGH"><Chip label="HIGH" size="small" color="warning" /></MenuItem>
                            <MenuItem value="URGENT"><Chip label="URGENT" size="small" color="error" /></MenuItem>
                          </Select>
                        </FormControl>
                        <Button 
                          variant="contained" 
                          startIcon={<Add />}
                          onClick={async () => {
                            if (!newTaskTitle.trim() || !selectedLead) return;
                            const res = await fetch(`/api/admin/leads/${selectedLead.id}/tasks`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                title: newTaskTitle,
                                description: newTaskDescription,
                                priority: newTaskPriority,
                              }),
                            });
                            if (res.ok) {
                              setNewTaskTitle('');
                              setNewTaskDescription('');
                              fetchTasks(selectedLead.id);
                            }
                          }}
                        >
                          Add Task
                        </Button>
                      </Box>
                    </Stack>
                  </Paper>

                  {/* Task List */}
                  {loadingTasks ? (
                    <Typography>Loading tasks...</Typography>
                  ) : tasks.length > 0 ? (
                    <Stack spacing={2}>
                      {tasks.map(task => (
                        <Paper key={task.id} variant="outlined" sx={{ p: 2, borderLeft: task.priority === 'URGENT' ? '3px solid #f44336' : task.priority === 'HIGH' ? '3px solid #ff9800' : task.priority === 'MEDIUM' ? '3px solid #2196f3' : '3px solid #9e9e9e' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">{task.title}</Typography>
                              {task.description && <Typography variant="body2" color="text.secondary">{task.description}</Typography>}
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Chip label={task.status} size="small" color={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'info' : 'default'} />
                                <Chip label={task.priority} size="small" color={task.priority === 'URGENT' ? 'error' : task.priority === 'HIGH' ? 'warning' : 'default'} />
                                {task.dueDate && <Typography variant="caption" sx={{ alignSelf: 'center' }}>Due: {new Date(task.dueDate).toLocaleDateString()}</Typography>}
                              </Stack>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              {task.status !== 'COMPLETED' && (
                                <IconButton size="small" onClick={async () => {
                                  await fetch(`/api/admin/leads/${selectedLead.id}/tasks`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ taskId: task.id, status: 'COMPLETED' }),
                                  });
                                  fetchTasks(selectedLead.id);
                                }}>
                                  <CheckCircle />
                                </IconButton>
                              )}
                              <IconButton size="small" color="error" onClick={async () => {
                                await fetch(`/api/admin/leads/${selectedLead.id}/tasks?taskId=${task.id}`, { method: 'DELETE' });
                                fetchTasks(selectedLead.id);
                              }}>
                                <Delete />
                              </IconButton>
                            </Stack>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info">No tasks yet. Create one above!</Alert>
                  )}
                </Box>
              )}

              {/* Tab 7: Notes */}
              {leadTab === 7 && selectedLead && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#8b5cf6' }}>Internal Notes</Typography>
                  
                  {/* Add New Note */}
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <TextField
                      label="Add a note..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                      sx={{ mb: 2 }}
                    />
                    <Button 
                      variant="contained" 
                      startIcon={<Note />}
                      onClick={async () => {
                        if (!newNoteContent.trim() || !selectedLead) return;
                        const res = await fetch(`/api/admin/leads/${selectedLead.id}/notes`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ content: newNoteContent }),
                        });
                        if (res.ok) {
                          setNewNoteContent('');
                          fetchNotes(selectedLead.id);
                        }
                      }}
                    >
                      Add Note
                    </Button>
                  </Paper>

                  {/* Notes List */}
                  {loadingNotes ? (
                    <Typography>Loading notes...</Typography>
                  ) : notes.length > 0 ? (
                    <Stack spacing={2}>
                      {notes.map(note => (
                        <Paper key={note.id} variant="outlined" sx={{ p: 2, bgcolor: 'rgba(139, 92, 246, 0.05)' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{note.content}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {note.createdBy} • {new Date(note.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                            <IconButton size="small" color="error" onClick={async () => {
                              await fetch(`/api/admin/leads/${selectedLead.id}/notes?noteId=${note.id}`, { method: 'DELETE' });
                              fetchNotes(selectedLead.id);
                            }}>
                              <Delete />
                            </IconButton>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info">No internal notes yet. Add one above!</Alert>
                  )}
                </Box>
              )}

              {/* Tab 8: Activity */}
              {leadTab === 8 && selectedLead && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#8b5cf6' }}>Activity Log</Typography>
                  
                  {loadingActivity ? (
                    <Typography>Loading activity...</Typography>
                  ) : activityLogs.length > 0 ? (
                    <Stack spacing={1}>
                      {activityLogs.map(log => (
                        <Paper key={log.id} variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                          <Box sx={{ 
                            width: 32, height: 32, borderRadius: '50%', 
                            bgcolor: log.type.includes('COMPLETED') || log.type.includes('SIGNED') || log.type.includes('RECEIVED') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: log.type.includes('COMPLETED') || log.type.includes('SIGNED') || log.type.includes('RECEIVED') ? '#10b981' : '#8b5cf6'
                          }}>
                            {log.type.includes('TASK') ? <CheckBox fontSize="small" /> :
                             log.type.includes('NOTE') ? <Note fontSize="small" /> :
                             log.type.includes('SERVICE') ? <Settings fontSize="small" /> :
                             log.type.includes('CONTRACT') ? <Description fontSize="small" /> :
                             log.type.includes('PAYMENT') ? <AttachMoney fontSize="small" /> :
                             <History fontSize="small" />}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2">{log.description}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.actor || 'System'} • {new Date(log.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info">No activity recorded yet.</Alert>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<Refresh />}
                      onClick={() => selectedLead && fetchActivity(selectedLead.id)}
                      sx={{ borderColor: glassTheme.cardBorder, color: glassTheme.textPrimary }}
                    >
                      Refresh
                    </Button>
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} sx={{ color: glassTheme.textSecondary }}>Close</Button>
          {leadTab === 1 && (
            <Button 
              variant="contained" 
              startIcon={<Save />} 
              onClick={saveLeadServices}
              disabled={savingServices}
            >
              {savingServices ? 'Saving...' : 'Save Services'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Propose New Service Dialog */}
      <Dialog 
        open={proposeOpen} 
        onClose={() => setProposeOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            bgcolor: 'rgba(15,23,42,1)', 
            border: `1px solid ${glassTheme.cardBorder}`, 
            color: glassTheme.textPrimary,
          }
        }}
      >
        <DialogTitle>Propose New Service to Client</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              label="Service Name" 
              fullWidth 
              value={proposeService.name}
              onChange={e => setProposeService({...proposeService, name: e.target.value})}
              placeholder="e.g., Additional AI Workflow Setup"
            />
            <TextField 
              label="Description" 
              fullWidth 
              multiline
              rows={3}
              value={proposeService.description}
              onChange={e => setProposeService({...proposeService, description: e.target.value})}
              placeholder="Describe what's included in this service..."
            />
            <TextField 
              label="Price (in cents)" 
              fullWidth 
              type="number"
              value={proposeService.price}
              onChange={e => setProposeService({...proposeService, price: parseInt(e.target.value) || 0})}
              placeholder="e.g., 29900 for $299"
              helperText="Enter price in cents (e.g., 29900 = $299.00)"
            />
            <FormControl fullWidth>
              <InputLabel>Billing Interval</InputLabel>
              <Select
                value={proposeService.interval}
                label="Billing Interval"
                onChange={e => setProposeService({...proposeService, interval: e.target.value})}
              >
                <MenuItem value="MONTHLY">Monthly</MenuItem>
                <MenuItem value="YEARLY">Yearly</MenuItem>
                <MenuItem value="ONE_TIME">One-time</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProposeOpen(false)} sx={{ color: glassTheme.textSecondary }}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<Send />}
            onClick={handleProposeService}
            disabled={proposeSending || !proposeService.name || !proposeService.price}
          >
            {proposeSending ? 'Sending...' : 'Send Proposal'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Documents Dialog */}
      <Dialog 
        open={requestDocOpen} 
        onClose={() => setRequestDocOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            bgcolor: 'rgba(15,23,42,1)', 
            border: `1px solid ${glassTheme.cardBorder}`, 
            color: glassTheme.textPrimary,
          }
        }}
      >
        <DialogTitle>Request Documents from Client</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              label="What documents do you need?" 
              fullWidth 
              multiline
              rows={4}
              value={requestDocMessage}
              onChange={e => setRequestDocMessage(e.target.value)}
              placeholder="e.g., Please upload your latest bank statements and tax documents for the quarterly review."
            />
            <Alert severity="info">
              This request will be sent to the client via email. They can upload documents through their Client Portal.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDocOpen(false)} sx={{ color: glassTheme.textSecondary }}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<Send />}
            onClick={handleRequestDocuments}
            disabled={requestDocSending || !requestDocMessage.trim()}
          >
            {requestDocSending ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Proposal Dialog */}
      <Dialog 
        open={createProposalOpen} 
        onClose={() => setCreateProposalOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { 
            bgcolor: 'rgba(15,23,42,1)', 
            border: `1px solid ${glassTheme.cardBorder}`, 
            color: glassTheme.textPrimary,
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ color: '#10b981', borderBottom: `1px solid ${glassTheme.cardBorder}`, pb: 2 }}>
          📋 Create Proposal for {selectedLead?.firstName} {selectedLead?.lastName}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Review selected services, customize pricing, add notes for the client, and create a formal proposal.
          </Typography>

          {/* Selected Services Summary */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#8b5cf6', mb: 1 }}>
              Selected Services ({selectedServices.length})
            </Typography>
            <Stack spacing={1}>
              {selectedServices.map(serviceId => {
                const service = services.find(s => s.id === serviceId);
                if (!service) return null;
                const customPrice = customPrices[serviceId] || service.basePrice;
                return (
                  <Paper 
                    key={serviceId}
                    sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${glassTheme.cardBorder}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                      <Box>
                        <Typography fontWeight="bold">
                          {service.icon} {service.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                          ${(customPrice / 100).toFixed(2)}
                          {customPrices[serviceId] && customPrices[serviceId] !== service.basePrice && (
                            <Chip size="small" label="Custom" sx={{ ml: 1, height: 18, bgcolor: '#f59e0b', color: '#fff' }} />
                          )}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {/* Per-service discount */}
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select
                            value={serviceDiscountTypes[serviceId] || ''}
                            displayEmpty
                            onChange={(e) => handleServiceDiscountTypeChange(serviceId, e.target.value as 'FLAT' | 'PERCENT')}
                            sx={{ color: '#fff', fontSize: '0.75rem' }}
                          >
                            <MenuItem value="">No disc.</MenuItem>
                            <MenuItem value="FLAT">$ Off</MenuItem>
                            <MenuItem value="PERCENT">% Off</MenuItem>
                          </Select>
                        </FormControl>
                        {serviceDiscountTypes[serviceId] && (
                          <TextField
                            size="small"
                            type="number"
                            placeholder={serviceDiscountTypes[serviceId] === 'PERCENT' ? '10' : '50'}
                            value={serviceDiscountValues[serviceId] || ''}
                            onChange={(e) => handleServiceDiscountValueChange(serviceId, parseInt(e.target.value) || 0)}
                            sx={{ width: 70 }}
                          />
                        )}
                      </Box>
                    </Box>
                    {/* Notes for this service */}
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Notes for client (e.g., 'Includes 3 workflows')"
                      value={serviceNotes[serviceId] || ''}
                      onChange={(e) => handleServiceNotesChange(serviceId, e.target.value)}
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                );
              })}
            </Stack>
          </Box>

          {/* Overall Proposal Discount */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(99,102,241,0.1)', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Proposal-Level Discount (Optional)
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={proposalDiscountType || ''}
                  label="Discount Type"
                  onChange={(e) => setProposalDiscountType(e.target.value as 'FLAT' | 'PERCENT')}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="FLAT">Flat $ Amount</MenuItem>
                  <MenuItem value="PERCENT">Percentage</MenuItem>
                </Select>
              </FormControl>
              {proposalDiscountType && (
                <TextField
                  size="small"
                  type="number"
                  label={proposalDiscountType === 'PERCENT' ? 'Percentage' : 'Amount ($)'}
                  value={proposalDiscountValue}
                  onChange={(e) => setProposalDiscountValue(parseInt(e.target.value) || 0)}
                  sx={{ width: 150 }}
                />
              )}
            </Box>
          </Box>

          {/* Proposal Notes for Client */}
          <TextField
            fullWidth
            label="Proposal Notes (for client)"
            multiline
            rows={3}
            placeholder="Add a message for the client about this proposal..."
            value={proposalNotes}
            onChange={(e) => setProposalNotes(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Total Summary */}
          <Box sx={{ p: 2, bgcolor: 'rgba(16,185,129,0.1)', borderRadius: 2, border: '1px solid #10b981' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#10b981' }}>
              Proposal Summary
            </Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
              {selectedServices.length} service(s) selected
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${glassTheme.cardBorder}`, py: 2, px: 3 }}>
          <Button onClick={() => setCreateProposalOpen(false)} sx={{ color: glassTheme.textSecondary }}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<Description />}
            onClick={createProposal}
            disabled={creatingProposal || selectedServices.length === 0}
            sx={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              fontWeight: 'bold',
              '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
            }}
          >
            {creatingProposal ? 'Creating...' : 'Create & Get Link'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Service Dialog */}
      <Dialog 
        open={customServiceOpen} 
        onClose={() => setCustomServiceOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { 
            bgcolor: 'rgba(15,23,42,1)', 
            border: `1px solid ${glassTheme.cardBorder}`, 
            color: glassTheme.textPrimary,
          }
        }}
      >
        <DialogTitle sx={{ color: '#f59e0b', borderBottom: `1px solid ${glassTheme.cardBorder}`, pb: 2 }}>
          🛠️ Add Custom Service
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a custom service tailored to this specific client. This will appear as "Custom Service Tailored to Client" in the proposal.
          </Typography>

          <TextField
            fullWidth
            label="Service Name"
            placeholder="e.g., PEO Onboarding Package"
            value={customServiceName}
            onChange={(e) => setCustomServiceName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Price ($)"
            type="number"
            placeholder="0.00"
            value={customServicePrice}
            onChange={(e) => setCustomServicePrice(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{ 
              startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>
            }}
          />

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            placeholder="Describe what's included in this custom service..."
            value={customServiceDescription}
            onChange={(e) => setCustomServiceDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCustomServiceOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (!customServiceName.trim() || !customServicePrice) {
                alert('Please enter service name and price');
                return;
              }
              // Add custom service to selected services with special prefix
              const customServiceId = 'custom-' + Date.now();
              const customPriceCents = Math.round(parseFloat(customServicePrice) * 100);
              
              // Add to services list (in memory only - won't persist to DB as a Service)
              // This creates a temporary service object for the proposal
              const customServiceObj = {
                id: customServiceId,
                name: 'Custom Service Tailored to Client',
                description: customServiceDescription || customServiceName,
                basePrice: customPriceCents,
                priceDisplay: `$${parseFloat(customServicePrice).toFixed(2)}`,
                icon: '🎯',
                category: 'CUSTOM',
                isCustom: true,
                customServiceName: customServiceName,
              };
              
              // Add to selected services
              setSelectedServices(prev => [...prev, customServiceId]);
              setCustomPrices(prev => ({ ...prev, [customServiceId]: customPriceCents }));
              
              // Store the custom service details
              setCustomServices(prev => ({ ...prev, [customServiceId]: customServiceObj }));
              
              // Close dialog and reset
              setCustomServiceOpen(false);
              setCustomServiceName('');
              setCustomServicePrice('');
              setCustomServiceDescription('');
              
              alert('Custom service added! Click "Create Proposal" to generate the agreement.');
            }}
            sx={{ 
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              fontWeight: 'bold',
            }}
          >
            Add Custom Service
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: glassTheme.cardBg,
            border: `1px solid ${glassTheme.cardBorder}`,
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ color: '#8b5cf6', borderBottom: `1px solid ${glassTheme.cardBorder}`, pb: 2 }}>
          Create Invoice
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={3}>
            {/* Line Items */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: glassTheme.textSecondary }}>
                Line Items
              </Typography>
              {invoiceLineItems.map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="Description"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...invoiceLineItems];
                      newItems[idx].description = e.target.value;
                      setInvoiceLineItems(newItems);
                    }}
                    size="small"
                    sx={{ flex: 2 }}
                  />
                  <TextField
                    label="Qty"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...invoiceLineItems];
                      newItems[idx].quantity = parseInt(e.target.value) || 1;
                      setInvoiceLineItems(newItems);
                    }}
                    size="small"
                    sx={{ width: 80 }}
                  />
                  <TextField
                    label="Unit Price ($)"
                    type="number"
                    value={item.unitPrice / 100}
                    onChange={(e) => {
                      const newItems = [...invoiceLineItems];
                      newItems[idx].unitPrice = Math.round((parseFloat(e.target.value) || 0) * 100);
                      setInvoiceLineItems(newItems);
                    }}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  {invoiceLineItems.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => setInvoiceLineItems(invoiceLineItems.filter((_, i) => i !== idx))}
                    >
                      ×
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => setInvoiceLineItems([...invoiceLineItems, { description: '', quantity: 1, unitPrice: 0 }])}
              >
                Add Line Item
              </Button>
            </Box>

            {/* Tax Rate */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Tax Rate (%)"
                type="number"
                value={invoiceTaxRate / 100}
                onChange={(e) => setInvoiceTaxRate(Math.round((parseFloat(e.target.value) || 0) * 100))}
                size="small"
                sx={{ width: 120 }}
              />
              <TextField
                label="Due In (days)"
                type="number"
                value={invoiceDueDays}
                onChange={(e) => setInvoiceDueDays(parseInt(e.target.value) || 30)}
                size="small"
                sx={{ width: 120 }}
              />
            </Box>

            {/* Notes */}
            <TextField
              label="Notes (optional)"
              value={invoiceNotes}
              onChange={(e) => setInvoiceNotes(e.target.value)}
              size="small"
              multiline
              rows={2}
              fullWidth
            />

            {/* Totals Preview */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
              {(() => {
                const subtotal = invoiceLineItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
                const taxAmount = Math.round(subtotal * (invoiceTaxRate / 10000));
                const total = subtotal + taxAmount;
                return (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: glassTheme.textSecondary }}>Subtotal:</Typography>
                      <Typography>${(subtotal / 100).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: glassTheme.textSecondary }}>Tax ({(invoiceTaxRate/100).toFixed(2)}%):</Typography>
                      <Typography>${(taxAmount / 100).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography fontWeight="bold">Total:</Typography>
                      <Typography fontWeight="bold" sx={{ color: '#8b5cf6' }}>${(total / 100).toFixed(2)}</Typography>
                    </Box>
                  </>
                );
              })()}
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${glassTheme.cardBorder}`, py: 2, px: 3 }}>
          <Button onClick={() => setInvoiceDialogOpen(false)} sx={{ color: glassTheme.textSecondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!invoiceLineItems[0]?.description) {
                alert('Add at least one line item');
                return;
              }
              setSavingInvoice(true);
              try {
                const lineItems = invoiceLineItems.map(item => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  total: item.unitPrice * item.quantity,
                }));
                const res = await fetch('/api/invoices', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    leadId: selectedLead?.id,
                    clientName: `${selectedLead?.firstName} ${selectedLead?.lastName}`.trim(),
                    clientEmail: selectedLead?.email,
                    lineItems,
                    taxRate: invoiceTaxRate,
                    notes: invoiceNotes,
                    dueDate: new Date(Date.now() + invoiceDueDays * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'SENT',
                  }),
                });
                const data = await res.json();
                if (data.id) {
                  // Now create Stripe checkout and send email
                  const checkoutRes = await fetch('/api/invoices/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invoiceId: data.id, sendEmail: true }),
                  });
                  const checkoutData = await checkoutRes.json();
                  if (checkoutData.paymentUrl) {
                    window.open(checkoutData.paymentUrl, '_blank');
                    navigator.clipboard.writeText(checkoutData.paymentUrl);
                    alert(`Invoice ${data.invoiceNumber} created and payment link sent to ${selectedLead?.email}!`);
                  } else {
                    alert(`Invoice ${data.invoiceNumber} created! (Email could not be sent)`);
                  }
                  setInvoiceDialogOpen(false);
                  if (selectedLead?.id) fetchInvoices(selectedLead.id);
                  setInvoiceLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
                  setInvoiceTaxRate(0);
                  setInvoiceNotes('');
                } else {
                  alert('Error: ' + (data.error || 'Failed to create invoice'));
                }
              } catch (err) {
                console.error('Failed to create invoice:', err);
                alert('Failed to create invoice');
              } finally {
                setSavingInvoice(false);
              }
            }}
            disabled={savingInvoice}
            sx={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', fontWeight: 'bold' }}
          >
            {savingInvoice ? 'Creating...' : 'Create & Send Invoice'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Analytics Dashboard Component
function ReplyToRequest({ requestId }: { requestId: string }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `REPLY: ${reply}`,
          isAdmin: true,
          clientRequestId: requestId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Reply sent to client!');
        setReply('');
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        size="small"
        placeholder="Reply to client..."
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        fullWidth
        onKeyPress={(e) => e.key === 'Enter' && sendReply()}
      />
      <Button 
        variant="contained" 
        size="small" 
        onClick={sendReply}
        disabled={!reply.trim() || sending}
      >
        {sending ? '...' : <Send />}
      </Button>
    </Box>
  );
}

export default function AdminDashboard() {
  return (
    <ThemeProvider theme={createTheme(darkTheme)}>
      <CssBaseline />
      <Suspense fallback={
        <Box sx={{ p: 4, textAlign: 'center', background: glassTheme.background, minHeight: '100vh' }}>
          <CircularProgress sx={{ color: '#6366f1' }} />
          <Typography sx={{ color: glassTheme.textPrimary, mt: 2 }}>Loading...</Typography>
        </Box>
      }>
        <AdminDashboardContent />
      </Suspense>
    </ThemeProvider>
  );
}