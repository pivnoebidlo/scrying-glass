// Update check: asks GitHub for the latest release (drafts and pre-releases are not "latest"). Only reads public
// release data; nothing about the GM or the vault is sent.
import { app } from 'electron';
import { RELEASES_API, RELEASES_PAGE, isNewer, isReleaseUrl, type UpdateInfo } from '../shared/updates';

export async function checkForUpdates(): Promise<UpdateInfo> {
  const current = app.getVersion();
  try {
    const res = await fetch(RELEASES_API, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': `ScryingGlass/${current}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const r = (await res.json()) as { tag_name?: string; html_url?: string };
    const latest = (r.tag_name ?? '').replace(/^v/i, '');
    if (!latest) throw new Error('no tag');
    const url = r.html_url && isReleaseUrl(r.html_url) ? r.html_url : RELEASES_PAGE;
    return { current, latest, url, newer: isNewer(latest, current) };
  } catch {
    return { current, latest: null, url: RELEASES_PAGE, newer: false };
  }
}
