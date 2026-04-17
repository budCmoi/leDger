import { createPublicKey } from 'node:crypto';

import jwt, { type JwtHeader, type JwtPayload } from 'jsonwebtoken';

import { env, isFirebaseAuthConfigured } from '../config/env';

const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

type FirebaseJwk = {
  kid: string;
  kty: 'RSA';
  alg: 'RS256';
  use: 'sig';
  n: string;
  e: string;
};

type FirebaseTokenClaims = JwtPayload & {
  auth_time?: number;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

type FirebaseDecodedToken = {
  header: JwtHeader;
  payload: FirebaseTokenClaims;
};

type FirebaseJwkResponse = {
  keys?: FirebaseJwk[];
};

type CachedFirebaseKeys = {
  keys: FirebaseJwk[];
  expiresAt: number;
  clockOffsetMs: number;
};

export type DecodedFirebaseIdToken = FirebaseTokenClaims & {
  uid: string;
};

let cachedFirebaseKeys: CachedFirebaseKeys | null = null;

const parseCacheLifetimeSeconds = (cacheControlHeader: string | null) => {
  const maxAgeValue = cacheControlHeader?.match(/max-age=(\d+)/i)?.[1];
  const maxAgeInSeconds = Number(maxAgeValue);

  return Number.isFinite(maxAgeInSeconds) && maxAgeInSeconds > 0 ? maxAgeInSeconds : 60 * 60;
};

const parseClockOffsetMs = (dateHeader: string | null) => {
  const remoteTimestamp = Date.parse(dateHeader ?? '');

  return Number.isFinite(remoteTimestamp) ? remoteTimestamp - Date.now() : 0;
};

const isFirebaseJwk = (value: unknown): value is FirebaseJwk => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<FirebaseJwk>;

  return Boolean(
    candidate.kid &&
      candidate.kty === 'RSA' &&
      candidate.alg === 'RS256' &&
      candidate.use === 'sig' &&
      candidate.n &&
      candidate.e,
  );
};

const fetchFirebaseKeys = async (forceRefresh = false) => {
  if (!forceRefresh && cachedFirebaseKeys && cachedFirebaseKeys.expiresAt > Date.now()) {
    return cachedFirebaseKeys;
  }

  const response = await fetch(FIREBASE_JWKS_URL);

  if (!response.ok) {
    throw new Error('Unable to fetch Firebase signing keys');
  }

  const payload = (await response.json()) as FirebaseJwkResponse;
  const keys = (payload.keys ?? []).filter(isFirebaseJwk);

  if (keys.length === 0) {
    throw new Error('Firebase signing keys response is empty');
  }

  cachedFirebaseKeys = {
    keys,
    expiresAt: Date.now() + parseCacheLifetimeSeconds(response.headers.get('cache-control')) * 1000,
    clockOffsetMs: parseClockOffsetMs(response.headers.get('date')),
  };

  return cachedFirebaseKeys;
};

const decodeFirebaseToken = (idToken: string): FirebaseDecodedToken => {
  const decodedToken = jwt.decode(idToken, { complete: true });

  if (!decodedToken || typeof decodedToken === 'string') {
    throw new Error('Malformed Firebase token');
  }

  return {
    header: decodedToken.header,
    payload: decodedToken.payload as FirebaseTokenClaims,
  };
};

const resolveFirebasePublicKey = async (kid: string) => {
  let keySet = await fetchFirebaseKeys();
  let matchingKey = keySet.keys.find((key) => key.kid === kid);

  if (!matchingKey) {
    keySet = await fetchFirebaseKeys(true);
    matchingKey = keySet.keys.find((key) => key.kid === kid);
  }

  if (!matchingKey) {
    throw new Error('Unknown Firebase signing key');
  }

  return {
    publicKey: createPublicKey({
      key: matchingKey,
      format: 'jwk',
    }),
    clockTimestamp: Math.floor((Date.now() + keySet.clockOffsetMs) / 1000),
  };
};

export const verifyFirebaseIdToken = async (idToken: string): Promise<DecodedFirebaseIdToken> => {
  if (!isFirebaseAuthConfigured || !env.FIREBASE_PROJECT_ID) {
    throw new Error('Firebase authentication is not configured');
  }

  const { header } = decodeFirebaseToken(idToken);

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Malformed Firebase token header');
  }

  const { publicKey, clockTimestamp } = await resolveFirebasePublicKey(header.kid);
  const decodedClaims = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    audience: env.FIREBASE_PROJECT_ID,
    issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
    clockTimestamp,
  }) as FirebaseTokenClaims;

  if (!decodedClaims.sub || decodedClaims.sub.length > 128) {
    throw new Error('Invalid Firebase subject claim');
  }

  if (
    typeof decodedClaims.auth_time === 'number' &&
    decodedClaims.auth_time * 1000 > Date.now() + 5_000
  ) {
    throw new Error('Invalid Firebase auth_time claim');
  }

  return {
    ...decodedClaims,
    uid: decodedClaims.sub,
  };
};