import { NextRequest, NextResponse } from 'next/server';

// POST /api/enrich/social - Enrich a lead's social profiles via Sherlock
// Takes a username or array of usernames, returns found social profiles
// Works in serverless via fetch-based checks; falls back to CLI sherlock if available
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

    // Try Sherlock CLI first (works on self-hosted / local)
    const cliResult = await trySherlockCLI(searchTerms);
    if (cliResult) {
      return NextResponse.json({
        success: true,
        results: cliResult,
        count: Object.keys(cliResult).length,
        method: 'sherlock-cli',
      });
    }

    // Fallback: HTTP-based profile checks for major platforms (works in serverless)
    const results: Record<string, Record<string, string>> = {};
    for (const term of searchTerms) {
      const profiles = await checkMajorPlatforms(term);
      results[term] = profiles;
    }

    return NextResponse.json({
      success: true,
      results,
      count: Object.keys(results).length,
      method: 'http-check',
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

    // Try Sherlock CLI first
    const cliResult = await trySherlockCLI([username]);
    if (cliResult && cliResult[username] && !('error' in cliResult[username])) {
      return NextResponse.json({
        success: true,
        username,
        profiles: cliResult[username],
        found: Object.keys(cliResult[username]).length,
        method: 'sherlock-cli',
      });
    }

    // Fallback: HTTP-based checks
    const profiles = await checkMajorPlatforms(username);
    return NextResponse.json({
      success: true,
      username,
      profiles,
      found: Object.keys(profiles).length,
      method: 'http-check',
    });
  } catch (error: any) {
    console.error('Social enrichment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enrich social profiles' },
      { status: 500 }
    );
  }
}

// Try to run Sherlock CLI (local/self-hosted only)
async function trySherlockCLI(usernames: string[]): Promise<Record<string, Record<string, string>> | null> {
  try {
    const { execFile } = require('child_process');
    const util = require('util');
    const execFileAsync = util.promisify(execFile);

    const results: Record<string, Record<string, string>> = {};

    for (const term of usernames) {
      try {
        const { stdout } = await execFileAsync('sherlock', [
          '--print-found',
          '--timeout', '10',
          term
        ], { timeout: 30000 });

        const lines = stdout.split('\n').filter((l: string) => l.startsWith('[+]'));
        const profiles: Record<string, string> = {};
        for (const line of lines) {
          const match = line.match(/\[\+\]\s+([\w\s]+?):\s+(https?:\/\/\S+)/);
          if (match) {
            profiles[match[1].trim()] = match[2];
          }
        }
        results[term] = profiles;
      } catch {
        // Sherlock CLI not available — return null to trigger fallback
        return null;
      }
    }
    return results;
  } catch {
    return null;
  }
}

// HTTP-based profile checks for major platforms (works in serverless/Vercel)
async function checkMajorPlatforms(username: string): Promise<Record<string, string>> {
  const profiles: Record<string, string> = {};

  const platforms: { name: string; url: string; checkMode: 'status' | 'redirect' | 'body' }[] = [
    { name: 'Twitter/X', url: `https://x.com/${username}`, checkMode: 'status' },
    { name: 'Instagram', url: `https://www.instagram.com/${username}`, checkMode: 'status' },
    { name: 'TikTok', url: `https://www.tiktok.com/@${username}`, checkMode: 'status' },
    { name: 'GitHub', url: `https://github.com/${username}`, checkMode: 'status' },
    { name: 'LinkedIn', url: `https://www.linkedin.com/in/${username}`, checkMode: 'status' },
    { name: 'YouTube', url: `https://www.youtube.com/@${username}`, checkMode: 'status' },
    { name: 'Reddit', url: `https://www.reddit.com/user/${username}`, checkMode: 'status' },
    { name: 'Medium', url: `https://medium.com/@${username}`, checkMode: 'status' },
    { name: 'Pinterest', url: `https://www.pinterest.com/${username}`, checkMode: 'status' },
    { name: 'Twitch', url: `https://www.twitch.tv/${username}`, checkMode: 'status' },
    { name: 'Spotify', url: `https://open.spotify.com/user/${username}`, checkMode: 'status' },
    { name: 'Facebook', url: `https://www.facebook.com/${username}`, checkMode: 'status' },
    { name: 'Snapchat', url: `https://www.snapchat.com/add/${username}`, checkMode: 'status' },
    { name: 'SoundCloud', url: `https://soundcloud.com/${username}`, checkMode: 'status' },
    { name: 'Keybase', url: `https://keybase.io/${username}`, checkMode: 'status' },
    { name: 'GitLab', url: `https://gitlab.com/${username}`, checkMode: 'status' },
    { name: 'HackerNews', url: `https://news.ycombinator.com/user?id=${username}`, checkMode: 'status' },
    { name: 'Patreon', url: `https://www.patreon.com/${username}`, checkMode: 'status' },
    { name: 'DeviantArt', url: `https://www.deviantart.com/${username}`, checkMode: 'status' },
    { name: 'Behance', url: `https://www.behance.net/${username}`, checkMode: 'status' },
  ];

  // Check platforms in parallel with concurrency limit
  const batchSize = 5;
  for (let i = 0; i < platforms.length; i += batchSize) {
    const batch = platforms.slice(i, i + batchSize);
    const checks = batch.map(async (platform) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(platform.url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ALBS-Enrich/1.0)',
          },
          redirect: 'follow',
        });
        clearTimeout(timeout);

        // 200 = likely exists, 404 = definitely not, 403 = might exist (blocked by auth wall)
        if (res.status === 200 || res.status === 403) {
          profiles[platform.name] = platform.url;
        }
      } catch {
        // Timeout or network error — skip
      }
    });

    await Promise.allSettled(checks);
  }

  return profiles;
}