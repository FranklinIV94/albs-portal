// lib/enrichment.ts - Using Apollo.io for lead enrichment
import axios from 'axios';

const APOLLO_API_KEY = process.env.APOLLO_API_KEY || 'EoF8r9_QnIGETsvfhPczgw';

interface ApolloPosition {
  company_name: string;
  company_logo_url?: string;
  title: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
}

interface ApolloPerson {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  work_history?: ApolloPosition[];
}

export async function enrichLeadFromLinkedin(linkedinUrl: string) {
  try {
    // Apollo's person enrichment endpoint
    const response = await axios.post(
      'https://api.apollo.io/api/v1/people/enrich',
      {
        linkedin_url: linkedinUrl,
        reveal_phone_number: true,
        reveal_email: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': APOLLO_API_KEY,
        },
      }
    );

    const person: ApolloPerson = response.data.person;

    if (!person) {
      throw new Error('No person data returned from Apollo');
    }

    // Transform Apollo work history to our database format
    const positions = (person.work_history || []).map((exp: ApolloPosition) => ({
      companyName: exp.company_name,
      companyLogo: exp.company_logo_url || '', // Apollo provides company logos!
      title: exp.title,
      startDate: exp.start_date || '',
      endDate: exp.is_current ? 'Present' : (exp.end_date || ''),
      isCurrent: exp.is_current || false,
    }));

    return {
      firstName: person.first_name,
      lastName: person.last_name,
      email: person.email,
      phone: person.phone,
      linkedinUrl: person.linkedin_url,
      positions,
    };
  } catch (error: any) {
    console.error('Apollo enrichment error:', error.response?.data || error.message);
    throw new Error(`Failed to enrich lead: ${error.message}`);
  }
}

// Alternative: Search by domain + name instead of LinkedIn URL
export async function enrichLeadByEmail(email: string) {
  try {
    const response = await axios.post(
      'https://api.apollo.io/api/v1/people/enrich',
      {
        email: email,
        reveal_phone_number: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': APOLLO_API_KEY,
        },
      }
    );

    const person: ApolloPerson = response.data.person;

    if (!person) {
      throw new Error('No person data returned from Apollo');
    }

    const positions = (person.work_history || []).map((exp: ApolloPosition) => ({
      companyName: exp.company_name,
      companyLogo: exp.company_logo_url || '',
      title: exp.title,
      startDate: exp.start_date || '',
      endDate: exp.is_current ? 'Present' : (exp.end_date || ''),
      isCurrent: exp.is_current || false,
    }));

    return {
      firstName: person.first_name,
      lastName: person.last_name,
      email: person.email,
      phone: person.phone,
      linkedinUrl: person.linkedin_url,
      positions,
    };
  } catch (error: any) {
    console.error('Apollo enrichment error:', error.response?.data || error.message);
    throw new Error(`Failed to enrich lead: ${error.message}`);
  }
}

// Bulk enrich for批量 processing
export async function enrichBulkLeads(leads: { linkedinUrl?: string; email?: string }[]) {
  const results = await Promise.allSettled(
    leads.map(lead => 
      lead.linkedinUrl 
        ? enrichLeadFromLinkedin(lead.linkedinUrl)
        : lead.email 
          ? enrichLeadByEmail(lead.email)
          : Promise.reject(new Error('No identifier provided'))
    )
  );

  return results.map((result, index) => ({
    index,
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null,
  }));
}
