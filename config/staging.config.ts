import type { EnvConfig } from './env.config';

const config: EnvConfig = {
  name: 'staging',
  baseURL: process.env.STAGING_BASE_URL ?? 'https://automationexercise.com',
  apiURL: process.env.STAGING_API_URL ?? 'https://automationexercise.com/api',
  credentials: {
    email: process.env.STAGING_USER_EMAIL ?? '',
    password: process.env.STAGING_USER_PASSWORD ?? '',
  },
  secondaryCredentials: {
    email: process.env.STAGING_USER2_EMAIL ?? '',
    password: process.env.STAGING_USER2_PASSWORD ?? '',
  },
};

export default config;
