import { NextRequest, NextResponse } from 'next/server';

// POST /api/enrich/social - Enrich a lead's social profiles via Sherlock
// Takes a username or array of usernames, returns found social profiles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, usernames } = body;

    const searchTerms = usernames || (username ? [username] : []);
    if (searchTerms.length === 0) {
      return NextResponse.json(
        { error: 'Username or usernames array is required' },
        { status: 400 }
      );
    }

    if (searchTerms.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 usernames per request' },
        { status: 400 }
      );
    }

    // Run Sherlock via child process
    const { execFile } = require('child_process');
    const util = require('util');
    const execFileAsync = util.promisify(execFile);

    const results: Record<string, Record<string, string>> = {};

    for (const term of searchTerms) {
      try {
        const { stdout } = await execFileAsync('sherlock', [
          '--print-found',
          '--timeout', '10',
          '--json', '-',
          term
        ], { timeout: 30000 });

        // Parse Sherlock JSON output
        try {
          const parsed = JSON.parse(stdout);
          results[term] = parsed;
        } catch {
          // Fallback: parse text output
          const lines = stdout.split('\n').filter((l: string) => l.startsWith('[+]'));
          const profiles: Record<string, string> = {};
          for (const line of lines) {
            const match = line.match(/\[\+\]\s+(\w[\w\s]*?):\s+(https?:\/\/\S+)/);
            if (match) {
              profiles[match[1].trim()] = match[2];
            }
          }
          results[term] = profiles;
        }
      } catch (err: any) {
        results[term] = { error: err.message || 'Sherlock lookup failed' };
      }
    }

    return NextResponse.json({
      success: true,
      results,
      count: Object.keys(results).length,
    });
  } catch (error: any) {
    console.error('Social enrichment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enrich social profiles' },
      { status: 500 }
    );
  }
}

// GET /api/enrich/social?username=xxx - Quick lookup for a single username
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      );
    }

    const { execFile } = require('child_process');
    const util = require('util');
    const execFileAsync = util.promisify(execFile);

    try {
      const { stdout } = await execFileAsync('sherlock', [
        '--print-found',
        '--timeout', '10',
        username
      ], { timeout: 30000 });

      const lines = stdout.split('\n').filter((l: string) => l.startsWith('[+]'));
      const profiles: Record<string, string> = {};
      for (const line of lines) {
        const match = line.match(/\[\+\]\s+([\w\s]+?):\s+(https?:\/\/\S+)/);
        if (match) {
          profiles[match[1].trim()] = match[2];
        }
      }

      return NextResponse.json({
        success: true,
        username,
        profiles,
        found: Object.keys(profiles).length,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || 'Sherlock lookup failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Social enrichment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enrich social profiles' },
      { status: 500 }
    );
  }
}