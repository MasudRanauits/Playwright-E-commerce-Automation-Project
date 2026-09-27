import type { EnvConfig } from './env.config';

const config: EnvConfig = {
  name: 'prod',
  baseURL: process.env.PROD_BASE_URL ?? 'https://automationexercise.com',
  apiURL: process.env.PROD_API_URL ?? 'https://automationexercise.com/api',
  credentials: {
    email: process.env.PROD_USER_EMAIL ?? '',
    password: process.env.PROD_USER_PASSWORD ?? '',
  },
};

export default config;
