import { mergeTests } from '@playwright/test';
import { test as pageTest, PageFixtures } from './page.fixtures';
import { ApiHelper } from '../utils/api.helper';
import env, { EnvConfig } from '../config/env.config';

type BaseFixtures = {
  api: ApiHelper;
  env: EnvConfig;
};

const apiTest = pageTest.extend<BaseFixtures>({
  api: async ({ request }, use) => {
    await use(new ApiHelper(request));
  },
  env: async ({}, use) => {
    await use(env);
  },
});

/**
 * The single entry point for specs:
 *   import { test, expect } from '../../fixtures/base.fixture';
 */
export const test = mergeTests(apiTest);
export { expect } from '@playwright/test';
export type { BaseFixtures, PageFixtures };
