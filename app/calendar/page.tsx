'use client';

import { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Grid, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Chip,
  Card, CardContent, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  CalendarMonth, AccessTime, Person, Email, Phone, Notes,
  ArrowBack, ArrowForward, CheckCircle, EventAvailable, Public
} from '@mui/icons-material';

interface TimeSlot {
  date: string;
  time: string;
  datetime: string;
}

// All time zones with UTC offsets
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: -4 },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: -5 },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: -6 },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: -7 },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: -8 },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)', offset: -10 },
];

// Provider's time zone (Franklin is in Eastern)
const PROVIDER_TIMEZONE = 'America/New_York';

export default function CalendarPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userTimezone, setUserTimezone] = useState('America/New_York');

  const slotsPerWeek = 7;

  useEffect(() => {
    fetchAvailability();
  }, []);

  // Filter out past slots and convert times
  const getAdjustedSlots = (allSlots: TimeSlot[]): TimeSlot[] => {
    const now = new Date();
    const userOffset = TIMEZONES.find(tz => tz.value === userTimezone)?.offset || -4;
    const providerOffset = -4; // Eastern

    return allSlots
      .map(slot => {
        // Parse the slot in provider's timezone (Eastern)
        const [datePart, timePart] = slot.datetime.split('T');
        const [hours, minutes] = timePart.split(':').map(Number);
        
        // Create date in provider timezone
        const slotDate = new Date(`${datePart}T12:00:00-04:00`);
        slotDate.setHours(hours, minutes, 0, 0);
        
        // Convert to user's timezone
        const userDate = new Date(slotDate.getTime() + (providerOffset - userOffset) * 60 * 60 * 1000);
        
        return {
          ...slot,
          date: userDate.toISOString().split('T')[0],
          time: userDate.toTimeString().slice(0, 5),
          datetime: userDate.toISOString().slice(0, 16),
        };
      })
      .filter(slot => {
        // Filter out past dates/times for today
        const slotDateTime = new Date(`${slot.date}T${slot.time}:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const slotDay = new Date(slot.date);
        slotDay.setHours(0, 0, 0, 0);
        
        // If it's today, filter out past times
        if (slotDay.getTime() === today.getTime()) {
          const now = new Date();
          const slotTime = new Date(`${slot.date}T${slot.time}:00`);
          return slotTime > now;
        }
        
        return slotDay >= today;
      });
  };

  const fetchAvailability = async () => {
    try {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 21);
      
      const res = await fetch(`/api/calendar/availability?start=${start.toISOString().split('T')[0]}&end=${end.toISOString().split('T')[0]}`);
      const data = await res.json();
      setSlots(data.available || []);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered and adjusted slots
  const adjustedSlots = getAdjustedSlots(slots);
  const weekSlots = adjustedSlots.slice(currentWeek * slotsPerWeek, (currentWeek + 1) * slotsPerWeek);

  // Check if there are more weeks
  const totalWeeks = Math.ceil(adjustedSlots.length / slotsPerWeek);
  const hasNextWeek = currentWeek < totalWeeks - 1;
  const hasPrevWeek = currentWeek > 0;

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setShowBookingDialog(true);
    setError('');
  };

  const handleBook = async () => {
    if (!bookingForm.name || !bookingForm.email || !selectedSlot) {
      setError('Name and email are required');
      return;
    }

    setBookingLoading(true);
    setError('');

    try {
      // Convert user's selected time back to provider's timezone (Eastern) for storage
      const userOffset = TIMEZONES.find(tz => tz.value === userTimezone)?.offset || -4;
      const providerOffset = -4;
      
      const userDateTime = new Date(`${selectedSlot.date}T${selectedSlot.time}:00`);
      const providerDateTime = new Date(userDateTime.getTime() + (userOffset - providerOffset) * 60 * 60 * 1000);

      const res = await fetch('/api/webhook/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule_event',
          event: {
            title: `Consultation with ${bookingForm.name}`,
            start_time: providerDateTime.toISOString(),
            end_time: new Date(providerDateTime.getTime() + 60 * 60 * 1000).toISOString(),
            event_type: 'consultation',
            location: 'Virtual',
            notes: bookingForm.notes,
            lead_name: bookingForm.name,
            lead_email: bookingForm.email,
            lead_phone: bookingForm.phone,
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        setBookingSuccess(true);
        // Remove booked slot from list
        setSlots(prev => prev.filter(s => s.datetime !== selectedSlot.datetime));
      } else {
        setError(data.error || 'Failed to schedule. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to schedule. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getProviderTimezoneLabel = () => {
    return TIMEZONES.find(tz => tz.value === PROVIDER_TIMEZONE)?.label || 'Eastern Time (ET)';
  };

  if (bookingSuccess) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0a1418 0%, #1a1a2e 100%)',
        py: 8,
        px: 2
      }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <CheckCircle sx={{ fontSize: 80, color: '#10b981', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Consultation Scheduled!
            </Typography>
            <Typography color="text.secondary" paragraph>
              Your consultation has been booked for:
            </Typography>
            <Chip 
              label={`${formatDisplayDate(selectedSlot?.date || '')} at ${selectedSlot?.time}`}
              color="primary"
              sx={{ fontSize: '1.1rem', py: 2.5, px: 1 }}
            />
            <Typography color="text.secondary" sx={{ mt: 3 }}>
              We've sent a confirmation to {bookingForm.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Your time has been converted to {getProviderTimezoneLabel()}.
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 4 }}
              onClick={() => {
                setBookingSuccess(false);
                setShowBookingDialog(false);
                setSelectedSlot(null);
                setBookingForm({ name: '', email: '', phone: '', notes: '' });
              }}
            >
              Book Another
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a1418 0%, #1a1a2e 100%)',
      py: 4,
      px: 2
    }}>
      <Container maxWidth="md">
        {/* Timezone Selector */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Public sx={{ color: '#667eea' }} />
            <Typography sx={{ color: '#fff' }}>Your Timezone:</Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={userTimezone}
                onChange={(e) => setUserTimezone(e.target.value)}
                sx={{ 
                  color: '#fff',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                  '.MuiSvgIcon-root': { color: '#fff' }
                }}
              >
                {TIMEZONES.map((tz) => (
                  <MenuItem key={tz.value} value={tz.value}>{tz.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', ml: 'auto' }}>
              Provider is in {getProviderTimezoneLabel()}
            </Typography>
          </Box>
        </Paper>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h3" 
            fontWeight="bold"
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            <CalendarMonth sx={{ verticalAlign: 'middle', mr: 1, fontSize: 40 }} />
            Book a Consultation
          </Typography>
          <Typography color="rgba(255,255,255,0.7)">
            Select a time that works for you. Times are shown in your local timezone.
          </Typography>
        </Box>

        {/* Calendar Grid */}
        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
          {/* Week Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button 
              onClick={() => setCurrentWeek(w => Math.max(0, w - 1))}
              disabled={!hasPrevWeek}
              sx={{ color: '#fff' }}
            >
              <ArrowBack /> Previous
            </Button>
            <Typography variant="h6" sx={{ color: '#fff' }}>
              {weekSlots[0] ? formatDisplayDate(weekSlots[0].date) : ''} - {weekSlots[weekSlots.length - 1] ? formatDisplayDate(weekSlots[weekSlots.length - 1].date) : ''}
            </Typography>
            <Button 
              onClick={() => setCurrentWeek(w => w + 1)}
              disabled={!hasNextWeek}
              sx={{ color: '#fff' }}
            >
              Next <ArrowForward />
            </Button>
          </Box>

          {loading ? (
            <Typography sx={{ color: '#fff', textAlign: 'center' }}>Loading available times...</Typography>
          ) : (
            <Grid container spacing={2}>
              {weekSlots.map((slot) => (
                <Grid item xs={12} sm={6} md={4} key={slot.datetime}>
                  <Card 
                    onClick={() => handleSlotClick(slot)}
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { 
                        transform: 'translateY(-4px)', 
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                      },
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        {formatDisplayDate(slot.date)}
                      </Typography>
                      <Chip 
                        icon={<AccessTime />}
                        label={slot.time}
                        size="small"
                        sx={{ mt: 1, bgcolor: '#667eea', color: '#fff' }}
                      />
                      <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
                        Your time
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {weekSlots.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                No available slots in this period. Check back next week!
              </Typography>
              {currentWeek > 0 && (
                <Button 
                  onClick={() => setCurrentWeek(0)}
                  sx={{ mt: 2, color: '#667eea' }}
                >
                  Go to current week
                </Button>
              )}
            </Box>
          )}
        </Paper>

        {/* Admin link */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button 
            href="/admin"
            sx={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
          >
            Admin Login
          </Button>
        </Box>
      </Container>

      {/* Booking Dialog */}
      <Dialog 
        open={showBookingDialog} 
        onClose={() => !bookingLoading && setShowBookingDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventAvailable color="primary" />
            <Typography variant="h5" fontWeight="bold">Confirm Your Booking</Typography>
          </Box>
          {selectedSlot && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {formatDisplayDate(selectedSlot.date)} at {selectedSlot.time} ({TIMEZONES.find(tz => tz.value === userTimezone)?.label})
            </Typography>
          )}
        </DialogTitle>

        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Full Name"
              fullWidth
              required
              value={bookingForm.name}
              onChange={(e) => setBookingForm(f => ({ ...f, name: e.target.value }))}
              InputProps={{
                startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
            
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              required
              value={bookingForm.email}
              onChange={(e) => setBookingForm(f => ({ ...f, email: e.target.value }))}
              InputProps={{
                startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
            
            <TextField
              label="Phone Number"
              fullWidth
              value={bookingForm.phone}
              onChange={(e) => setBookingForm(f => ({ ...f, phone: e.target.value }))}
              InputProps={{
                startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
            
            <TextField
              label="Notes (optional)"
              fullWidth
              multiline
              rows={3}
              value={bookingForm.notes}
              onChange={(e) => setBookingForm(f => ({ ...f, notes: e.target.value }))}
              InputProps={{
                startAdornment: <Notes sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />
              }}
              placeholder="What would you like to discuss?"
            />
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            Your time will be converted to {getProviderTimezoneLabel()} when scheduled.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setShowBookingDialog(false)}
            disabled={bookingLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleBook}
            disabled={bookingLoading}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              px: 4
            }}
          >
            {bookingLoading ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}