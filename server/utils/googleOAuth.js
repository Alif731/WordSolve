const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

const getGoogleOAuthConfig = () => ({
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_CALLBACK_URL || '',
});

const isGoogleOAuthConfigured = () => {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  return Boolean(clientId && clientSecret && redirectUri);
};

const ensureFetch = () => {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is unavailable. Use Node.js 18+ to enable Google sign-in.');
  }

  return fetch;
};

const readJson = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

const buildGoogleAuthorizationUrl = (state) => {
  const { clientId, redirectUri } = getGoogleOAuthConfig();

  if (!clientId || !redirectUri) {
    throw new Error('Google sign-in is not configured.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email',
    prompt: 'select_account',
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

const exchangeGoogleCodeForTokens = async (code) => {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const runFetch = ensureFetch();

  const response = await runFetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Google token exchange failed.');
  }

  if (!data.access_token) {
    throw new Error('Google did not return an access token.');
  }

  return data;
};

const fetchGoogleUserProfile = async (accessToken) => {
  const runFetch = ensureFetch();
  const response = await runFetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Google identity request failed.');
  }

  return data;
};

module.exports = {
  buildGoogleAuthorizationUrl,
  exchangeGoogleCodeForTokens,
  fetchGoogleUserProfile,
  getGoogleOAuthConfig,
  isGoogleOAuthConfigured,
};
