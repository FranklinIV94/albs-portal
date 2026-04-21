import { NextRequest, NextResponse } from 'next/server';
import { createOutlookEvent } from '@/lib/graph';

/**
 * Create a calendar event in Nadesha's Outlook calendar
 * Uses the same client-credentials Graph API flow as createOutlookEvent (Franklin's)
 */
export async function createNadeshaOutlookEvent(params: {
  subject: string;
  body?: string;
  start: Date;
  end: Date;
  attendeeEmail?: string;
  attendeeName?: string;
  location?: string;
}) {
  const { subject, body, start, end, attendeeEmail, attendeeName, location } = params;
  const nadeshaEmail = process.env.NADESHA_EMAIL || 'support@simplifyingbusinesses.com';

  // Reuse the same getAccessToken + raw fetch approach for the Nadesha mailbox
  const GRAPH_CLIENT_ID = process.env.GRAPH_CLIENT_ID;
  const GRAPH_CLIENT_SECRET = process.env.GRAPH_CLIENT_SECRET;
  const GRAPH_TENANT_ID = process.env.GRAPH_TENANT_ID;

  if (!GRAPH_CLIENT_ID || !GRAPH_CLIENT_SECRET || !GRAPH_TENANT_ID) {
    throw new Error('Microsoft Graph credentials not configured');
  }

  // Get token
  const tokenUrl = `https://login.microsoftonline.com/${GRAPH_TENANT_ID}/oauth2/v2.0/token`;
  const tokenParams = new URLSearchParams({
    client_id: GRAPH_CLIENT_ID,
    client_secret: GRAPH_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
  });

  if (!tokenRes.ok) throw new Error(`Token fetch failed: ${await tokenRes.text()}`);
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  const event = {
    subject,
    body: body ? { contentType: 'HTML', content: body } : undefined,
    start: { dateTime: start.toISOString(), timeZone: 'Eastern Standard Time' },
    end: { dateTime: end.toISOString(), timeZone: 'Eastern Standard Time' },
    location: location ? { displayName: location } : undefined,
    attendees: attendeeEmail ? [{
      emailAddress: { address: attendeeEmail, name: attendeeName || attendeeEmail },
      type: 'required' as const,
    }] : undefined,
    isOnlineMeeting: true,
    onlineMeetingProvider: 'teamsForBusiness',
  };

  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${nadeshaEmail}/calendar/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('Nadesha Outlook event creation failed:', errText);
      return { success: false, error: errText };
    }

    const result = await res.json();
    return { success: true, eventId: result.id };
  } catch (error: any) {
    console.error('Nadesha Outlook event error:', error);
    return { success: false, error: error.message };
  }
}