import { NextRequest, NextResponse } from 'next/server';

// POST /api/enrich/phone - Validate and enrich a phone number
// Uses phonenumbers library (Python GhostTrack-equivalent) for carrier/location data
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

    // Run GhostTrack phone lookup via Python
    const { execFile } = require('child_process');
    const util = require('util');
    const execFileAsync = util.promisify(execFile);

    const pythonScript = `
import json
import sys

try:
    import phonenumbers
    from phonenumbers import carrier, geocoder, timezone
    
    phone = "${phone.replace(/"/g, '\\"')}"
    default_region = "${countryCode || 'US'}"
    
    parsed = phonenumbers.parse(phone, default_region)
    
    result = {
        "valid": phonenumbers.is_valid_number(parsed),
        "possible": phonenumbers.is_possible_number(parsed),
        "formatted_international": phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.INTERNATIONAL),
        "formatted_national": phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL),
        "formatted_e164": phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164),
        "country_code": str(parsed.country_code),
        "region_code": phonenumbers.region_code_for_number(parsed) or "",
        "carrier": carrier.name_for_number(parsed, "en") or "",
        "location": geocoder.description_for_number(parsed, "en") or "",
        "number_type": str(parsed.number_type),
        "timezones": [str(tz) for tz in (timezone.time_zones_for_number(parsed) or [])],
    }
    
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

    try {
      const { stdout } = await execFileAsync('python3', ['-c', pythonScript], { timeout: 10000 });
      const phoneData = JSON.parse(stdout.trim());

      if (phoneData.error) {
        return NextResponse.json(
          { error: phoneData.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        phone,
        ...phoneData,
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