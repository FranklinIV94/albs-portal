import { Client } from '@microsoft/microsoft-graph-client';

// Graph API configuration
const GRAPH_CLIENT_ID = process.env.GRAPH_CLIENT_ID;
const GRAPH_CLIENT_SECRET = process.env.GRAPH_CLIENT_SECRET;
const GRAPH_TENANT_ID = process.env.GRAPH_TENANT_ID;

// Token cache
let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get OAuth access token for Microsoft Graph
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  if (!GRAPH_CLIENT_ID || !GRAPH_CLIENT_SECRET || !GRAPH_TENANT_ID) {
    throw new Error('Microsoft Graph credentials not configured');
  }

  const tokenUrl = `https://login.microsoftonline.com/${GRAPH_TENANT_ID}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: GRAPH_CLIENT_ID,
    client_secret: GRAPH_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Graph access token: ${error}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  // Set expiry 5 minutes before actual expiry to be safe
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
  
  return accessToken!;
}

/**
 * Create an authenticated Graph client
 */
export function getGraphClient() {
  return Client.init({
    authProvider: async (done) => {
      try {
        const token = await getAccessToken();
        done(null, token);
      } catch (error) {
        done(error as Error, null);
      }
    },
  });
}

/**
 * Create a calendar event in Franklin's Outlook calendar
 */
export async function createOutlookEvent(params: {
  subject: string;
  body?: string;
  start: Date;
  end: Date;
  attendeeEmail?: string;
  attendeeName?: string;
  location?: string;
}) {
  const { subject, body, start, end, attendeeEmail, attendeeName, location } = params;

  const client = getGraphClient();

  const event = {
    subject,
    body: body ? {
      contentType: 'HTML',
      content: body,
    } : undefined,
    start: {
      dateTime: start.toISOString(),
      timeZone: 'Eastern Standard Time',
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: 'Eastern Standard Time',
    },
    location: location ? {
      displayName: location,
    } : undefined,
    attendees: attendeeEmail ? [
      {
        emailAddress: {
          address: attendeeEmail,
          name: attendeeName || attendeeEmail,
        },
        type: 'required',
      },
    ] : undefined,
    isOnlineMeeting: true,
    onlineMeetingProvider: 'teamsForBusiness',
  };

  try {
    // Create event in Franklin's calendar (using app-only auth)
    const result = await client.api('/users/franklin@simplifyingbusinesses.com/calendar/events').post(event);
    return { success: true, eventId: result.id };
  } catch (error: any) {
    console.error('Failed to create Outlook event:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a calendar event from Franklin's Outlook calendar
 */
export async function deleteOutlookEvent(eventId: string) {
  const client = getGraphClient();

  try {
    await client.api(`/users/franklin@simplifyingbusinesses.com/calendar/events/${eventId}`).delete();
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete Outlook event:', error);
    return { success: false, error: error.message };
  }
}