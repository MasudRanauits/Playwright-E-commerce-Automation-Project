/**
 * The entry point for the workflow specs (WF-01 to WF-21).
 *
 * It re-exports the base fixture so a workflow spec has one import, and adds
 * the two things every workflow needs: a guest session and the cart teardown.
 */
import { CapturedProduct } from '../pages/components/ProductGridComponent';

export { test, expect } from './base.fixture';
export type { BaseFixtures, PageFixtures } from './base.fixture';
export {
  addProducts,
  addSameProduct,
  buildCart,
  ensureEmptyCart,
  resetAccountCart,
} from '../utils/cart.helper';
export type { CapturedProduct };

/**
 * A signed-out session. The chromium project loads the stored login from
 * auth.setup.ts, so any workflow that asserts guest behaviour must opt out:
 *
 *   test.use({ storageState: GUEST_SESSION });
 */
export const GUEST_SESSION: { cookies: []; origins: [] } = { cookies: [], origins: [] };
