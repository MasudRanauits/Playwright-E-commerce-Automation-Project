import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export type EnvName = 'qa' | 'staging' | 'prod';

export interface EnvConfig {
  name: EnvName;
  baseURL: string;
  apiURL: string;
  credentials: {
    email: string;
    password: string;
  };
  /**
   * A second registered account, used only by the cross-account isolation
   * cases (TC-W15-010, TC-W18-005). Those cases skip when it is absent: a
   * missing secret is an environment condition, not an application defect.
   */
  secondaryCredentials?: {
    email: string;
    password: string;
  };
}

/** Where auth.setup.ts saves the logged-in session for the UI projects. */
export const STORAGE_STATE = path.resolve(__dirname, '..', 'playwright', '.auth', 'user.json');

/** The environment under test. Override with ENV=staging npm test */
export const ENV = (process.env.ENV ?? 'qa') as EnvName;

/** Loads the config module matching ENV. */
export function getEnvConfig(env: EnvName = ENV): EnvConfig {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require(`./${env}.config`).default as EnvConfig;

  if (!config) {
    throw new Error(`No configuration found for environment "${env}"`);
  }
  return config;
}

export default getEnvConfig();
