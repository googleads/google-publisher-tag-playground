/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {SampleConfig} from '../../src/model/sample-config.js';

import {expect, test} from './fixtures/configurator.js';

const SAMPLE_AD_SLOT: SampleConfig = {
  slots: [{adUnit: '/6355419/Travel/Europe', size: [100, 100]}],
};

const PREVIEW_PAGE_GLOB = '**/index.html';

test.describe('Toolbar buttons', () => {
  test.use({config: SAMPLE_AD_SLOT});

  test('Refresh reloads preview', async ({
    browserName,
    configurator,
    context,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Mocking network requests from service workers is only supported in Chrome.',
    );

    // Disable loading GPT for this test, but keep track of the number of times
    // it was requested. This tells us how many times the preview was requested.
    let previewRequestCount = 0;
    await context.route('**/gpt.js', async route => {
      previewRequestCount++;
      await route.abort();
    });

    // Wait for the preview to be requested.
    await configurator.page.waitForEvent('framenavigated');

    // Locate the preview frame and wait for it to be fully loaded.
    const previewFrame = configurator.page.frame({
      url: PREVIEW_PAGE_GLOB,
    });
    expect(previewFrame).not.toBeNull();
    await previewFrame?.waitForLoadState('networkidle');
    expect(previewRequestCount).toEqual(1);

    // Take a screenshot of the intial state of the preview frame.
    const previewFrameElem = await previewFrame?.frameElement();
    const originalPreview = await previewFrameElem?.screenshot({
      animations: 'disabled',
    });

    // Click the refresh button and wait for the preview to reload.
    const previewPane = configurator.page.locator('gpt-playground-preview');
    await previewPane.getByText('refresh').click();
    await previewFrame?.waitForLoadState('networkidle');
    expect(previewRequestCount).toEqual(2);

    // Ensure the preview frame contains the same content as before.
    const newPreview = await previewFrameElem?.screenshot({
      animations: 'disabled',
    });
    expect(newPreview).toEqual(originalPreview);
  });
});
