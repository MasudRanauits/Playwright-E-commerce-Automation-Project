import type { EnvConfig } from './env.config';

const config: EnvConfig = {
  name: 'qa',
  baseURL: process.env.QA_BASE_URL ?? 'https://automationexercise.com',
  apiURL: process.env.QA_API_URL ?? 'https://automationexercise.com/api',
  credentials: {
    email: process.env.QA_USER_EMAIL ?? '',
    password: process.env.QA_USER_PASSWORD ?? '',
  },
};

export default config;
