import { test, expect, GUEST_SESSION } from '../../fixtures/workflow.fixture';
import { timeouts } from '../../config/test.config';
import { naturalWidth } from '../../utils/browser.helper';

/**
 * WF-03 — Promotional Slider.
 *
 * Nothing here is bound to a specific slide: the assertions compare the
 * identity of the active slide before and after an interaction, so the cases
 * survive marketing content changes and auto-rotation alike.
 */
test.use({ storageState: GUEST_SESSION });

test.describe('WF-03 Promotional Slider', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
    await expect(homePage.slider.root).toBeVisible();
  });

  test('TC-W03-001 the slider renders with exactly one active slide @regression @ui', async ({
    homePage,
  }) => {
    const state = await homePage.slider.state();

    expect(state.total, 'slide count').toBeGreaterThan(1);
    expect(state.activeCount, 'slides carrying the active state').toBe(1);

    const image = homePage.slider.activeSlideImage();
    await expect(image).toBeVisible();
    expect(await naturalWidth(image), 'active slide image decoded width').toBeGreaterThan(0);
  });

  test('TC-W03-002 the next control advances the slider @regression', async ({ homePage }) => {
    const before = await homePage.slider.state();

    await homePage.slider.next.click();
    const after = await homePage.slider.waitForActiveChange(before.activeIndex);

    expect(after.activeIndex, 'active slide after Next').not.toBe(before.activeIndex);
    expect(after.activeCount).toBe(1);
  });

  test('TC-W03-003 the previous control moves the slider backwards @regression', async ({
    homePage,
  }) => {
    const initial = await homePage.slider.state();
    await homePage.slider.next.click();
    const advanced = await homePage.slider.waitForActiveChange(initial.activeIndex);

    await homePage.slider.prev.click();
    const back = await homePage.slider.waitForActiveChange(advanced.activeIndex);

    expect(back.activeIndex, 'active slide after Previous').not.toBe(advanced.activeIndex);
    expect(back.activeCount).toBe(1);
  });

  test('TC-W03-004 the indicator controls select a slide directly @regression @ui', async ({
    homePage,
  }) => {
    /* Pause first: rotation between the click and the assertion is otherwise
       an intermittent failure with no application cause. */
    await homePage.slider.pauseAutoRotation();

    const state = await homePage.slider.state();
    const indicatorCount = await homePage.slider.indicators.count();
    expect(indicatorCount, 'indicator count vs slide count').toBe(state.total);

    const target = indicatorCount - 1;
    await homePage.slider.indicators.nth(target).click();

    await expect
      .poll(async () => homePage.slider.activeIndicatorIndex(), {
        timeout: timeouts.animation,
        message: 'active indicator index',
      })
      .toBe(target);
    expect((await homePage.slider.state()).activeIndex).toBe(target);
  });

  test('TC-W03-005 the slider auto-rotates without user interaction @regression @flaky-watch', async ({
    homePage,
  }) => {
    const before = await homePage.slider.state();

    /* A fluent wait on the condition, never a fixed sleep; the interval lives
       in configuration so a design change is not a code change. */
    await expect
      .poll(async () => (await homePage.slider.state()).activeIndex, {
        timeout: timeouts.sliderRotationWait,
        message: 'active slide index while idle',
      })
      .not.toBe(before.activeIndex);

    expect((await homePage.slider.state()).activeCount).toBe(1);
  });
});
