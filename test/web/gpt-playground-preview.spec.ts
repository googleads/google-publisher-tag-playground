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

import {TCData} from '@iabtechlabtcf/cmpapi';

import {SampleConfig} from '../../src/model/sample-config.js';

import {expect, test} from './fixtures/configurator.js';

const SAMPLE_AD_SLOT: SampleConfig = {
  slots: [{adUnit: '/6355419/Travel/Europe', size: [100, 100]}],
};

const PREVIEW_SAMPLE_GLOB = '**/sample.js';
const PREVIEW_SELECTOR = 'gpt-playground-preview';

test.describe('Toolbar controls', () => {
  test.use({config: SAMPLE_AD_SLOT});

  test.describe('EU user consent', () => {
    const CONSENT_LABEL = 'EU user consent';

    /**
     * Test Additional Consent (AC) string.
     *
     * Example AC string from
     * https://support.google.com/admanager/answer/9681920.
     */
    const TEST_AC_STRING = '2~1.35.41.101~dv.9.21.81';

    /**
     * Test TCData object.
     * TCString generated using default values from https://iabtcf.com/#/encode.
     */
    const TEST_TCDATA = {
      cmpId: 300, // Google LLC
      cmpVersion: 0,
      tcString:
        'CQStAtkQStAtkEsAAAENCZCAAAAAAAAAAAAAAAAAAAAA.II7Nd_X__bX9n-_7_6ft0eY1f9_r37uQzDhfNs-8F3L_W_LwX32E7NF36tq4KmR4ku1bBIQNtHMnUDUmxaolVrzHsak2cpyNKJ_JkknsZe2dYGF9Pn9lD-YKZ7_5_9_f52T_9_9_-39z3_9f___dv_-__-vjf_599n_v9fV_78_Kf9______-____________8A',
      addtlConsent: TEST_AC_STRING,
    } as unknown as TCData;

    test('Disabled by default', async ({configurator}) => {
      const previewPane = configurator.page.locator(PREVIEW_SELECTOR);
      const consentControl = configurator.getCheckbox(
        CONSENT_LABEL,
        previewPane,
      );
      await expect(consentControl).not.toBeChecked();
    });

    test('Enabling launches consent window', async ({configurator}) => {
      const previewPane = configurator.page.locator(PREVIEW_SELECTOR);
      const consentControl = configurator.getCheckbox(
        CONSENT_LABEL,
        previewPane,
      );

      const pagePromise = configurator.page.context().waitForEvent('page');
      await consentControl.click();
      expect(await pagePromise).toBeDefined();
    });

    test('Only enables when consent response is recieved', async ({
      configurator,
    }) => {
      const previewPane = configurator.page.locator(PREVIEW_SELECTOR);
      const consentControl = configurator.getCheckbox(
        CONSENT_LABEL,
        previewPane,
      );

      const pagePromise = configurator.page.context().waitForEvent('page');
      await consentControl.click();
      await expect(consentControl).not.toBeChecked();

      const consentPage = await pagePromise;
      await consentPage.evaluate(data => {
        window.opener.postMessage(data, window.location.origin);
      }, TEST_TCDATA);

      // For some reason expect(...).toBeChecked() never returns `true` here.
      // Instead, explicitly look for the `checked` attribute.
      await expect(consentControl).toHaveAttribute('checked');
    });

    test('Disabling unchecks checkbox', async ({configurator}) => {
      const previewPane = configurator.page.locator(PREVIEW_SELECTOR);
      const consentControl = configurator.getCheckbox(
        CONSENT_LABEL,
        previewPane,
      );

      const pagePromise = configurator.page.context().waitForEvent('page');
      await consentControl.click();
      await expect(consentControl).not.toBeChecked();

      const consentPage = await pagePromise;
      await consentPage.evaluate(data => {
        window.opener.postMessage(data, window.location.origin);
      }, TEST_TCDATA);

      // For some reason expect(...).toBeChecked() never returns `true` here.
      // Instead, explicitly look for the `checked` attribute.
      await expect(consentControl).toHaveAttribute('checked');
      await consentControl.click();
      await expect(consentControl).not.toHaveAttribute('checked');
    });

    test('Ad request includes TCData values only when enabled', async ({
      browserName,
      configurator,
    }) => {
      test.skip(
        browserName !== 'chromium',
        'Mocking network requests from service workers is only supported in Chrome.',
      );

      const previewPane = configurator.page.locator(PREVIEW_SELECTOR);
      const consentControl = configurator.getCheckbox(
        CONSENT_LABEL,
        previewPane,
      );

      const pagePromise = configurator.page.context().waitForEvent('page');
      let requestPromise = configurator.page.waitForRequest('**/gampad/ads?**');

      // Enable consent and check for TCData values in the ad request.
      await consentControl.click();

      const consentPage = await pagePromise;
      await consentPage.evaluate(data => {
        window.opener.postMessage(data, window.location.origin);
      }, TEST_TCDATA);

      let adRequest = await requestPromise;
      expect(adRequest.url()).toContain(TEST_TCDATA.tcString);
      expect(adRequest.url()).toContain(TEST_AC_STRING);

      requestPromise = configurator.page.waitForRequest('**/gampad/ads?**');

      // Disable consent and ensure TCData values are not included in the ad
      // request.
      await consentControl.click();

      adRequest = await requestPromise;
      expect(adRequest.url()).not.toContain(TEST_TCDATA.tcString);
      expect(adRequest.url()).not.toContain(TEST_AC_STRING);
    });
  });
});

test.describe('Toolbar buttons', () => {
  test.use({config: SAMPLE_AD_SLOT});

  test('Refresh reloads preview', async ({configurator}) => {
    // Wait for the preview to be requested.
    const firstResponse =
      await configurator.page.waitForResponse(PREVIEW_SAMPLE_GLOB);
    const originalConfig = (await firstResponse.body()).toString();

    // Click the refresh button.
    const previewPromise =
      configurator.page.waitForResponse(PREVIEW_SAMPLE_GLOB);
    const previewPane = configurator.page.locator(PREVIEW_SELECTOR);
    await previewPane.getByText('refresh').click();

    // Wait for the preview to be requested again.
    const secondResponse = await previewPromise;
    const newConfig = (await secondResponse.body()).toString();

    // Ensure that the requests were initiated one after the other.
    expect(secondResponse.request().timing().startTime).toBeGreaterThan(
      firstResponse.request().timing().startTime,
    );

    // Ensure that the requests contained the same sample config.
    expect(newConfig).toEqual(originalConfig);
  });
});
