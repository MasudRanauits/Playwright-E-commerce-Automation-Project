import { Locator, Page, expect } from '@playwright/test';
import { locators } from '../../data/locators';
import { timeouts } from '../../config/test.config';

/** The state of the hero carousel, read atomically. */
export interface SliderState {
  total: number;
  activeCount: number;
  activeIndex: number;
  activeId: string;
}

/**
 * The promotional slider. Assertions are written against the identity of the
 * active slide, never against a fixed index, so the cases survive both the
 * marketing content changing and auto-rotation moving the slider mid-test.
 */
export class SliderComponent {
  readonly page: Page;

  readonly root: Locator;
  readonly items: Locator;
  readonly activeItem: Locator;
  readonly next: Locator;
  readonly prev: Locator;
  readonly indicators: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator(locators.HOME_SLIDER);
    this.items = page.locator(locators.HOME_SLIDER_ITEMS);
    this.activeItem = page.locator(locators.HOME_SLIDER_ACTIVE);
    this.next = page.locator(locators.HOME_SLIDER_NEXT);
    this.prev = page.locator(locators.HOME_SLIDER_PREV);
    this.indicators = page.locator(locators.HOME_SLIDER_INDICATORS);
  }

  /**
   * TC-W03-001 — read in a single evaluation. Separate driver calls can observe
   * a transitional state where zero or two slides are briefly marked active.
   */
  async state(): Promise<SliderState> {
    return this.page.evaluate((selector) => {
      const items = Array.from(document.querySelectorAll(selector + ' .carousel-inner .item'));
      const activeIndex = items.findIndex((item) => item.classList.contains('active'));
      return {
        total: items.length,
        activeCount: items.filter((item) => item.classList.contains('active')).length,
        activeIndex,
        activeId:
          activeIndex >= 0
            ? items[activeIndex].getAttribute('id') ?? 'index-' + activeIndex
            : '',
      };
    }, locators.HOME_SLIDER);
  }

  /** Waits until the transition has settled on a slide other than the one given. */
  async waitForActiveChange(previousIndex: number, timeout = timeouts.animation): Promise<SliderState> {
    await expect
      .poll(async () => (await this.state()).activeIndex, { timeout, message: 'active slide index' })
      .not.toBe(previousIndex);
    await expect(this.page.locator(locators.HOME_SLIDER_ITEMS + '.next')).toHaveCount(0);
    return this.state();
  }

  /** TC-W03-004 — pause the rotation so it cannot move between a click and its assertion. */
  async pauseAutoRotation(): Promise<void> {
    await this.page.evaluate((selector) => {
      const w = window as unknown as { jQuery?: (sel: string) => { carousel?: (cmd: string) => void } };
      w.jQuery?.(selector).carousel?.('pause');
    }, locators.HOME_SLIDER);
  }

  async activeIndicatorIndex(): Promise<number> {
    return this.indicators.evaluateAll((els) => els.findIndex((el) => el.classList.contains('active')));
  }

  activeSlideImage(): Locator {
    return this.activeItem.locator('img').first();
  }
}
