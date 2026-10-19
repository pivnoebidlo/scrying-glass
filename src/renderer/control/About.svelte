<!-- Settings → About: the app and its version, the project's links, the license (GPL with its «no warranty»), and the
     credits of the material by other authors the app includes. -->
<script lang="ts">
  import { ExternalLink } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { AUTHOR, CREDITS, GPL_URL, ISSUES_URL, LICENSE_URL, REPO_URL } from '../../shared/about';
  import { RELEASES_PAGE } from '../../shared/updates';
  import { t } from '../lib/i18n.svelte';
  import icon from '../../../build/icon.png';

  let version = $state('');
  onMount(async () => (version = await window.api.appVersion()));
  const open = (url: string) => void window.api.openLink(url);
  const year = new Date().getFullYear();
</script>

<div class="about">
  <div class="head">
    <img class="icon" src={icon} alt="" />
    <div>
      <div class="name">Scrying Glass</div>
      <div class="faint">{t('about.version', { version })} · © {year} {AUTHOR}</div>
    </div>
  </div>
  <p>{t('about.tagline')}</p>
  <div class="links">
    <button class="link" onclick={() => open(REPO_URL)}><ExternalLink size={13} /> {t('about.repo')}</button>
    <button class="link" onclick={() => open(ISSUES_URL)}><ExternalLink size={13} /> {t('about.issues')}</button>
    <button class="link" onclick={() => open(RELEASES_PAGE)}><ExternalLink size={13} /> {t('about.releases')}</button>
  </div>

  <h3>{t('about.license')}: GPL-3.0-or-later</h3>
  <p class="muted">{t('about.licenseText')}</p>
  <div class="links">
    <button class="link" onclick={() => open(LICENSE_URL)}><ExternalLink size={13} /> {t('about.licenseFull')}</button>
    <button class="link" onclick={() => open(GPL_URL)}><ExternalLink size={13} /> GNU GPL v3</button>
  </div>

  <h3>{t('about.credits')}</h3>
  <p class="muted">{t('about.creditsAbout')}</p>
  <ul class="credits">
    {#each CREDITS as c (c.id)}
      <li>
        <div>{t(`about.credit.${c.id}` as never)}</div>
        <div class="faint">
          <button class="link plain" onclick={() => open(c.url)}>{c.who}</button> ·
          <button class="link plain" onclick={() => open(c.licenseUrl)}>{c.license}</button>
        </div>
      </li>
    {/each}
  </ul>
</div>

<style>
  .about {
    max-width: 640px;
    user-select: text;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
  }
  .name {
    font-size: 20px;
    font-weight: 600;
  }
  p {
    line-height: 1.5;
  }
  h3 {
    margin: 22px 0 6px;
    font-size: 14px;
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
  }
  .link:hover {
    text-decoration: underline;
  }
  .link.plain {
    display: inline;
    font-size: 12px;
    text-align: left;
  }
  .credits {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
  }
  .faint {
    font-size: 12px;
  }
</style>
