import { NextRequest, NextResponse } from 'next/server';

// Simple availability config - can be expanded later
const AVAILABLE_SLOTS = {
  // Generate slots for next 14 days
  'monday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  'tuesday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  'wednesday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  'thursday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  'friday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'],
};

function getDayName(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

// GET /api/calendar/availability - Get available slots for a date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start') || formatDate(new Date());
    const endDate = searchParams.get('end') || formatDate(addDays(new Date(), 14));

    const slots: { date: string; time: string; datetime: string }[] = [];
    
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dayName = getDayName(currentDate);
      const daySlots = AVAILABLE_SLOTS[dayName as keyof typeof AVAILABLE_SLOTS];
      
      if (daySlots) {
        for (const time of daySlots) {
          const datetime = `${formatDate(currentDate)}T${time}:00`;
          slots.push({
            date: formatDate(currentDate),
            time,
            datetime,
          });
        }
      }
      
      currentDate = addDays(currentDate, 1);
    }

    return NextResponse.json({
      available: slots,
      range: { start: startDate, end: endDate },
      message: 'Slots are 1 hour each. Business hours only.',
    });
  } catch (error: any) {
    console.error('Calendar availability error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}