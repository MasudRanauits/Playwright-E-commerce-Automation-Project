/**
 * Values the workflow suite asserts against.
 * Kept here so a design or content change is a configuration edit, not a code change.
 */

export const timeouts = {
  /** Slider / carousel transitions and modal fades. */
  animation: 5_000,
  /** The hero carousel rotates on its own; see TC-W03-005. */
  sliderRotation: 5_000,
  /** How long a fluent wait for an auto-rotation may run: interval + 5s. */
  sliderRotationWait: 10_000,
  /** The short wait used when the pass condition is "no dialog appeared". */
  noAlert: 2_000,
  /**
   * How long to let the load event arrive after DOMContentLoaded before
   * carrying on. It is a courtesy wait, not a gate: the pages are usable at
   * DOMContentLoaded and every caller then asserts on a visible element, so
   * this stays small. A long wait here would spend the whole test budget on
   * a third-party tail and leave none for the assertions.
   */
  documentReady: 10_000,
} as const;

export const budgets = {
  /** TC-W01-006, TC-W09-008 — indicative page load budget. */
  pageLoadMs: 5_000,
  /** TC-W11-010, TC-W17-006 — median interaction budget. */
  interactionMedianMs: 2_000,
} as const;

export const viewports = {
  /** TC-W02-008, TC-W09-007, TC-W15-008 */
  mobile: { width: 360, height: 640 },
  desktop: { width: 1440, height: 900 },
} as const;

export const expectedText = {
  homeTitle: 'Automation Exercise',
  allProducts: 'All Products',
  searchedProducts: 'Searched Products',
  featuresItems: 'Features Items',
  addedConfirmation: 'Added!',
  cartEmpty: 'Cart is empty',
  subscriptionSuccess: 'You have been successfully subscribed!',
  checkoutPrompt: 'Register / Login account',
  checkoutCta: 'Proceed To Checkout',
} as const;

export const expectedNav = [
  'Home',
  'Products',
  'Cart',
  'Signup / Login',
  'Test Cases',
  'API Testing',
  'Video Tutorials',
  'Contact us',
] as const;

export const expectedCartColumns = ['Item', 'Description', 'Price', 'Quantity', 'Total'] as const;

/** TC-W06-003 — a currency prefix followed by an integer amount, e.g. "Rs. 500". */
export const currencyPattern = /^Rs\.\s?\d[\d,]*$/;

/** Text that should never appear in a rendered body: TC-W01-001, TC-W10-006, TC-W12-005. */
export const serverErrorSignatures = [
  'Internal Server Error',
  'Fatal error',
  'Warning: mysqli',
  'SQLSTATE',
  'Traceback (most recent call last)',
  'You have an error in your SQL syntax',
  'Whoops, looks like something went wrong',
] as const;

/**
 * TC-W01-005 — console noise from third parties that must not fail the suite.
 * Review each sprint; never widen it to silence an application error.
 */
export const allowedConsoleNoiseHosts = [
  'googlesyndication.com',
  'googletagservices.com',
  'doubleclick.net',
  'adtrafficquality.google',
  'google-analytics.com',
  'googletagmanager.com',
  'ezoic.net',
  'ezodn.com',
  'gstatic.com',
  'facebook.net',
  'pagead2',
  'fundingchoicesmessages',
] as const;

/** TC-W08-002 — a collision-free subscriber address per run. */
export function uniqueSubscriberEmail(): string {
  return `qa.ae.auto+${Date.now()}@mailinator.com`;
}

/** TC-W08-004, TC-W20-003 — malformed addresses the field must reject. */
export const malformedEmails = [
  'plainaddress',
  'user@',
  '@domain.com',
  'user name@domain.com',
  'user@@domain.com',
] as const;

/** TC-W08-007, TC-W10-010 — the script payload that must never execute. */
export const scriptPayload = '<script>alert(1)</script>';

/** TC-W10-011 — the injection payload that must not disclose the catalogue. */
export const injectionPayload = "' OR '1'='1' --";

export const searchTerms = {
  partial: ['top', 'dress', 'tshirt', 'jean'] as const,
  caseVariants: ['top', 'TOP', 'ToP'] as const,
  unmatched: 'zzzzzqqqq',
  numeric: '1234567890',
  special: '!@#$%^&*',
  padded: '   top   ',
} as const;
