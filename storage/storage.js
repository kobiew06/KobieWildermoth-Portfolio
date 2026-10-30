(() => {
  'use strict';
  const config = window.STORAGE_CONFIG || {};
  const $ = id => document.getElementById(id);
  const callbackUrl = new URL('index.html', window.location.href).href;
  const limit = 10 * 1024 * 1024;
  let token = null;
  let expiresAt = 0;
  let nextToken = null;
  let busy = false;
  let expiryTimer;
  const configured = ['cognitoDomain', 'clientId', 'apiBaseUrl'].every(key => typeof config[key] === 'string' && config[key].trim());

  function status(message, error = false) {
    $('status').textContent = message;
    $('status').dataset.error = String(error);
  }
  function clearSession() {
    token = null;
    expiresAt = 0;
    nextToken = null;
    clearTimeout(expiryTimer);
    $('file-list').replaceChildren();
    $('file-panel').hidden = true;
    $('login-panel').hidden = false;
    $('account-label').textContent = '';
  }
  function base64url(bytes) {
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function signIn() {
    try {
      const verifier = base64url(crypto.getRandomValues(new Uint8Array(48)));
      const state = base64url(crypto.getRandomValues(new Uint8Array(32)));
      const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
      sessionStorage.setItem('cst230.oauth', JSON.stringify({ verifier, state, created: Date.now() }));
      const url = new URL('/oauth2/authorize', config.cognitoDomain);
      url.search = new URLSearchParams({ response_type: 'code', client_id: config.clientId, redirect_uri: callbackUrl, scope: 'openid', state, code_challenge: challenge, code_challenge_method: 'S256' });
      window.location.assign(url.href);
    } catch { status('Sign-in could not start. Allow session storage in this browser and try again.', true); }
  }
  async function api(path, options = {}) {
    if (!token || Date.now() >= expiresAt) {
      clearSession();
      throw new Error('Your session has expired. Please sign in again.');
    }
    const response = await fetch(config.apiBaseUrl.replace(/\/$/, '') + path, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    });
    if (response.status === 401) {
      clearSession();
      throw new Error('Your session has expired. Please sign in again.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `The request failed (${response.status}). Please try again.`);
    return data;
  }
  function sizeLabel(size) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KiB`;
    return `${(size / 1024 / 1024).toFixed(1)} MiB`;
  }
  function renderFiles(files, append) {
    if (!append) $('file-list').replaceChildren();
    for (const file of files) {
      const row = document.createElement('tr');
      for (const value of [file.name, sizeLabel(file.size), new Date(file.modified).toLocaleString()]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      const cell = document.createElement('td');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary-btn';
      button.textContent = 'Download';
      button.setAttribute('aria-label', `Download ${file.name}`);
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          const data = await api('/downloads', { method: 'POST', body: JSON.stringify({ key: file.key }) });
          const url = new URL(data.url);
          if (url.protocol !== 'https:') throw new Error('The download address is invalid.');
          const link = document.createElement('a');
          link.href = url.href;
          link.rel = 'noreferrer';
          link.download = file.name;
          document.body.append(link);
          link.click();
          link.remove();
          status(`Download requested for ${file.name}.`);
        } catch (error) { status(error.message, true); }
        finally { button.disabled = false; }
      });
      cell.append(button);row.append(cell);$('file-list').append(row);
    }
    const count = $('file-list').children.length;
    $('empty-message').hidden = count !== 0;
    $('file-count').textContent = `${count} file${count === 1 ? '' : 's'}${nextToken ? ' shown' : ''}`;
    $('load-more').hidden = !nextToken;
  }
  async function listFiles(append = false) {
    if (busy) return;
    busy = true;
    $('refresh').disabled = true;
    $('load-more').disabled = true;
    try {
      const query = append && nextToken ? `?nextToken=${encodeURIComponent(nextToken)}` : '';
      const data = await api('/files' + query);
      nextToken = data.nextToken || null;
      renderFiles(data.files, append);
      status('Your files are up to date.');
    } catch (error) { status(error.message, true); }
    finally { busy = false; $('refresh').disabled = false; $('load-more').disabled = false; }
  }
  $('sign-in').addEventListener('click', signIn);
  $('refresh').addEventListener('click', () => listFiles());
  $('load-more').addEventListener('click', () => listFiles(true));
  $('sign-out').addEventListener('click', () => {
    clearSession();
    const url = new URL('/logout', config.cognitoDomain);
    url.search = new URLSearchParams({ client_id: config.clientId, logout_uri: callbackUrl });
    window.location.assign(url.href);
  });
  $('upload-form').addEventListener('submit', async event => {
    event.preventDefault();
    const file = $('upload-file').files[0];
    if (!file) return;
    if (file.size > limit) return status('Please choose a file no larger than 10 MiB.', true);
    $('upload-button').disabled = true;
    status(`Uploading ${file.name}…`);
    try {
      const data = await api('/uploads', { method: 'POST', body: JSON.stringify({ filename: file.name, size: file.size }) });
      const form = new FormData();
      for (const [key, value] of Object.entries(data.fields)) form.append(key, value);
      form.append('file', file);
      if (new URL(data.url).protocol !== 'https:') throw new Error('The upload address is invalid.');
      const response = await fetch(data.url, { method: 'POST', body: form, referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error(`Upload failed (${response.status}). Try signing in again if the problem continues.`);
      $('upload-form').reset();
      await listFiles();
      status(`${file.name} uploaded successfully.`);
    } catch (error) { status(error.message, true); }
    finally { $('upload-button').disabled = false; }
  });
  async function start() {
    const params = new URLSearchParams(window.location.search);
    // Remove callback parameters before making network requests.
    if (params.has('code') || params.has('error')) history.replaceState({}, '', callbackUrl);
    if (!configured) return status('The web demo is being connected to AWS. Sign-in will be available once setup is complete.');
    try {
      if (new URL(config.cognitoDomain).protocol !== 'https:' || new URL(config.apiBaseUrl).protocol !== 'https:') throw new Error('Invalid configuration');
    } catch { return status('The storage connection needs configuration. Please contact Kobie.', true); }
    $('sign-in').disabled = false;
    if (!params.has('code') && !params.has('error')) return status('Sign in to access your files.');
    try {
      const saved = JSON.parse(sessionStorage.getItem('cst230.oauth') || 'null');
      sessionStorage.removeItem('cst230.oauth');
      if (!saved || saved.state !== params.get('state') || Date.now() - saved.created > 10 * 60 * 1000) throw new Error('This sign-in attempt has expired. Please sign in again.');
      if (params.has('error')) throw new Error('Sign-in was not completed. Please try again.');
      status('Finishing sign-in…');
      const response = await fetch(new URL('/oauth2/token', config.cognitoDomain), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', client_id: config.clientId, redirect_uri: callbackUrl, code: params.get('code'), code_verifier: saved.verifier }),
        referrerPolicy: 'no-referrer',
      });
      if (!response.ok) throw new Error('Sign-in could not be completed. Please try again.');
      const data = await response.json();
      if (!data.access_token || !Number.isFinite(data.expires_in) || data.expires_in <= 0) throw new Error('The sign-in response was invalid.');
      token = data.access_token;
      expiresAt = Date.now() + data.expires_in * 1000;
      expiryTimer = setTimeout(() => { clearSession(); status('Your session has expired. Please sign in again.'); }, data.expires_in * 1000);
      $('login-panel').hidden = true;
      $('file-panel').hidden = false;
      $('account-label').textContent = 'Private account storage';
      await listFiles();
    } catch (error) { clearSession(); status(error.message, true); }
  }
  start();
})();
