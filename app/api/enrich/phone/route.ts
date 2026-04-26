import { NextRequest, NextResponse } from 'next/server';
import { parsePhoneNumberFromString, getCountryCallingCode, Metadata } from 'libphonenumber-js';

// POST /api/enrich/phone - Validate and enrich a phone number using libphonenumber-js (pure JS, works in serverless)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, countryCode } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    try {
      const parsed = parsePhoneNumberFromString(phone, countryCode || 'US');

      if (!parsed) {
        return NextResponse.json(
          { error: 'Could not parse phone number' },
          { status: 400 }
        );
      }

      // Number type mapping
      const typeMap: Record<number, string> = {
        0: 'FIXED_LINE',
        1: 'MOBILE',
        2: 'FIXED_LINE_OR_MOBILE',
        3: 'TOLL_FREE',
        4: 'PREMIUM_RATE',
        5: 'SHARED_COST',
        6: 'VOIP',
        7: 'PERSONAL_NUMBER',
        8: 'PAGER',
        9: 'UAN',
        10: 'UNKNOWN',
      };

      return NextResponse.json({
        success: true,
        phone,
        valid: parsed.isValid(),
        possible: parsed.isPossible(),
        formatted_international: parsed.formatInternational(),
        formatted_national: parsed.formatNational(),
        formatted_e164: parsed.format('E.164'),
        country_calling_code: `+${parsed.countryCallingCode}`,
        country: parsed.country || '',
        region_code: parsed.country || '',
        number_type: typeMap[parsed.getType() as unknown as number] || 'UNKNOWN',
        // Note: carrier data requires external API; libphonenumber-js doesn't include it
        carrier: '',
        location: '', // Geocoder requires external data
        timezones: parsed.country ? [countryToTimezone(parsed.country)] : [],
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: `Phone validation failed: ${err.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Phone enrichment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate phone number' },
      { status: 500 }
    );
  }
}

// Simple country-to-timezone mapping for common regions
function countryToTimezone(country: string): string {
  const map: Record<string, string> = {
    US: 'America/New_York',
    GB: 'Europe/London',
    CA: 'America/Toronto',
    AU: 'Australia/Sydney',
    DE: 'Europe/Berlin',
    FR: 'Europe/Paris',
    JP: 'Asia/Tokyo',
    IN: 'Asia/Kolkata',
    BR: 'America/Sao_Paulo',
    MX: 'America/Mexico_City',
    ES: 'Europe/Madrid',
    IT: 'Europe/Rome',
    NL: 'Europe/Amsterdam',
    SE: 'Europe/Stockholm',
    CH: 'Europe/Zurich',
    NZ: 'Pacific/Auckland',
    SG: 'Asia/Singapore',
    HK: 'Asia/Hong_Kong',
    KR: 'Asia/Seoul',
    ZA: 'Africa/Johannesburg',
    AE: 'Asia/Dubai',
    IL: 'Asia/Jerusalem',
    RU: 'Europe/Moscow',
    CN: 'Asia/Shanghai',
  };
  return map[country] || 'Unknown';
}