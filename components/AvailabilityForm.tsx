'use client';

import { useState } from 'react';
import { 
  Card, CardContent, Typography, Box, Chip, Button, 
  FormControlLabel, Checkbox, TextField, Select, MenuItem, 
  FormControl, InputLabel, Alert, Stack
} from '@mui/material';
import { Schedule } from '@mui/icons-material';

interface AvailabilityData {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  timezone: string;
  isImmediatelyAvailable: boolean;
  noticePeriod: string;
  contactMethod: string;
}

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const TIME_SLOTS = [
  { key: 'morning', label: 'Morning', time: '8am - 12pm', icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', time: '12pm - 5pm', icon: '☀️' },
  { key: 'evening', label: 'Evening', time: '5pm - 8pm', icon: '🌆' },
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Pacific/Honolulu',
  'America/Anchorage',
];

const NOTICE_PERIODS = [
  'Immediately available',
  '1 week',
  '2 weeks',
  '1 month',
  '2 months',
  '3+ months',
];

export default function AvailabilityForm({ 
  initialData,
  onNext 
}: { 
  initialData?: Partial<AvailabilityData>;
  onNext: (data: AvailabilityData) => void;
}) {
  const [availability, setAvailability] = useState<AvailabilityData>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    morning: true,
    afternoon: true,
    evening: false,
    timezone: 'America/New_York',
    isImmediatelyAvailable: false,
    noticePeriod: '',
    contactMethod: 'email',
    ...initialData,
  });

  const [errors, setErrors] = useState<string[]>([]);

  const toggleDay = (day: string) => {
    setAvailability(prev => ({ ...prev, [day]: !prev[day as keyof AvailabilityData] }));
  };

  const toggleTimeSlot = (slot: string) => {
    setAvailability(prev => ({ ...prev, [slot]: !prev[slot as keyof AvailabilityData] }));
  };

  const handleSubmit = () => {
    // Validation
    const selectedDays = DAYS.filter(d => availability[d.key as keyof AvailabilityData]);
    const selectedTimes = TIME_SLOTS.filter(t => availability[t.key as keyof AvailabilityData]);

    const validationErrors: string[] = [];
    
    if (selectedDays.length === 0) {
      validationErrors.push('Please select at least one available day');
    }
    if (selectedTimes.length === 0) {
      validationErrors.push('Please select at least one time preference');
    }
    if (!availability.isImmediatelyAvailable && !availability.noticePeriod) {
      validationErrors.push('Please indicate your notice period or select immediately available');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onNext(availability);
  };

  const selectedDaysCount = DAYS.filter(d => availability[d.key as keyof AvailabilityData]).length;
  const selectedTimesCount = TIME_SLOTS.filter(t => availability[t.key as keyof AvailabilityData]).length;

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Schedule color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Your Availability
          </Typography>
        </Box>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((err, i) => <div key={i}>{err}</div>)}
          </Alert>
        )}

        {/* Days of Week */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Days Available
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {DAYS.map(day => (
              <Chip
                key={day.key}
                label={day.label}
                onClick={() => toggleDay(day.key)}
                color={availability[day.key as keyof AvailabilityData] ? 'primary' : 'default'}
                variant={availability[day.key as keyof AvailabilityData] ? 'filled' : 'outlined'}
                sx={{ 
                  fontWeight: availability[day.key as keyof AvailabilityData] ? 'bold' : 'normal',
                  minWidth: 50
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.disabled">
            {selectedDaysCount} day{selectedDaysCount !== 1 ? 's' : ''} selected
          </Typography>
        </Box>

        {/* Time Slots */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Preferred Times
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {TIME_SLOTS.map(slot => (
              <Chip
                key={slot.key}
                label={`${slot.icon} ${slot.label}`}
                onClick={() => toggleTimeSlot(slot.key)}
                color={availability[slot.key as keyof AvailabilityData] ? 'secondary' : 'default'}
                variant={availability[slot.key as keyof AvailabilityData] ? 'filled' : 'outlined'}
                sx={{ fontWeight: availability[slot.key as keyof AvailabilityData] ? 'bold' : 'normal' }}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.disabled">
            {selectedTimesCount} time slot{selectedTimesCount !== 1 ? 's' : ''} selected
          </Typography>
        </Box>

        {/* Timezone */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Timezone</InputLabel>
          <Select
            value={availability.timezone}
            label="Timezone"
            onChange={(e) => setAvailability(prev => ({ ...prev, timezone: e.target.value }))}
          >
            {TIMEZONES.map(tz => (
              <MenuItem key={tz} value={tz}>{tz.replace('America/', '').replace('_', ' ')}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Availability Status */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={availability.isImmediatelyAvailable}
                onChange={(e) => setAvailability(prev => ({ 
                  ...prev, 
                  isImmediatelyAvailable: e.target.checked,
                  noticePeriod: e.target.checked ? 'Immediately available' : prev.noticePeriod
                }))}
              />
            }
            label="I am immediately available to start"
          />
        </Box>

        {!availability.isImmediatelyAvailable && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Notice Period</InputLabel>
            <Select
              value={availability.noticePeriod}
              label="Notice Period"
              onChange={(e) => setAvailability(prev => ({ ...prev, noticePeriod: e.target.value }))}
            >
              {NOTICE_PERIODS.map(period => (
                <MenuItem key={period} value={period}>{period}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Contact Method */}
        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel>Preferred Contact Method</InputLabel>
          <Select
            value={availability.contactMethod}
            label="Preferred Contact Method"
            onChange={(e) => setAvailability(prev => ({ ...prev, contactMethod: e.target.value }))}
          >
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="phone">Phone</MenuItem>
            <MenuItem value="linkedin">LinkedIn Message</MenuItem>
          </Select>
        </FormControl>

        {/* Submit */}
        <Button 
          variant="contained" 
          size="large" 
          fullWidth 
          onClick={handleSubmit}
          disabled={selectedDaysCount === 0 || selectedTimesCount === 0}
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
