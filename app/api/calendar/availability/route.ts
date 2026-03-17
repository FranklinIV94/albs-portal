import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Base availability config - working hours
const AVAILABLE_SLOTS = {
  'monday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  'tuesday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  'wednesday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  'thursday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
  'friday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
};

// Buffer time in minutes (before and after booking)
const BUFFER_MINUTES = 30;

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

// Check if a time slot overlaps with any booked event (including buffer)
function isSlotBlocked(slotStart: Date, slotEnd: Date, bookedEvents: { startTime: Date; endTime: Date }[]): boolean {
  const slotStartTime = slotStart.getTime();
  const slotEndTime = slotEnd.getTime();
  
  for (const event of bookedEvents) {
    const eventStart = new Date(event.startTime).getTime();
    const eventEnd = new Date(event.endTime).getTime();
    
    // Add buffer to the booked event
    const bufferedStart = eventStart - (BUFFER_MINUTES * 60 * 1000);
    const bufferedEnd = eventEnd + (BUFFER_MINUTES * 60 * 1000);
    
    // Check if slot's START time falls within the buffered event period
    if (slotStartTime < bufferedEnd && slotStartTime >= bufferedStart) {
      return true;
    }
  }
  return false;
}

// GET /api/calendar/availability - Get available slots (excluding booked times + buffer)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start') || formatDate(new Date());
    const endParam = searchParams.get('end') || formatDate(addDays(new Date(), 14));

    // Fetch all booked events in the date range from database
    const bookedEvents = await prisma.calendarEvent.findMany({
      where: {
        startTime: {
          gte: new Date(startParam),
        },
        endTime: {
          lte: new Date(addDays(new Date(endParam), 1)),
        },
        status: {
          not: 'cancelled',
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const slots: { date: string; time: string; datetime: string }[] = [];
    
    let currentDate = new Date(startParam);
    const end = new Date(endParam);
    const allSlots: typeof slots = [];

    while (currentDate <= end) {
      const dayName = getDayName(currentDate);
      const daySlots = AVAILABLE_SLOTS[dayName as keyof typeof AVAILABLE_SLOTS];
      
      if (daySlots) {
        for (const time of daySlots) {
          const datetime = `${formatDate(currentDate)}T${time}:00`;
          
          // Create slot times in Eastern Time (provider's timezone)
          const [hours, minutes] = time.split(':').map(Number);
          // Create as ISO string with Eastern offset (-04:00 for EDT)
          const slotStart = new Date(`${formatDate(currentDate)}T${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00-04:00`);
          const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hour slots
          
          // Check if slot is blocked by existing booking (with buffer)
          if (!isSlotBlocked(slotStart, slotEnd, bookedEvents)) {
            allSlots.push({
              date: formatDate(currentDate),
              time,
              datetime,
            });
          }
        }
      }
      
      currentDate = addDays(currentDate, 1);
    }

    return NextResponse.json({
      available: allSlots,
      range: { start: startParam, end: endParam },
      bookedCount: bookedEvents.length,
      message: `Slots exclude booked times + ${BUFFER_MINUTES}min buffer`,
    });
  } catch (error: any) {
    console.error('Calendar availability error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}