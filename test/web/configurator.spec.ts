/**
 * Copyright 2024 Google LLC
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

import {Locator, Page} from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

import {SampleConfig} from '../../src/model/sample-config.js';

import {expect, test} from './fixtures/configurator.js';

test.describe('Configurator screenshots', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const CONFIG_DIR = path.resolve(__dirname, '../codegen-test-data/configs');

  const configs = fs.readdirSync(CONFIG_DIR);
  for (const config of configs) {
    if (path.extname(config) !== '.json') continue;

    const sample = fs.readFileSync(path.join(CONFIG_DIR, config), 'utf-8');
    const sampleName = config.replace('.json', '');

    test.describe('', () => {
      // Prepopulate the configurator with the sample config under test.
      test.use({
        config: JSON.parse(sample) as SampleConfig,
      });

      test(`Sample config ${sampleName} prepopulates correctly.`, async ({
        configurator,
        page,
      }) => {
        // Set the viewport to a standard size, so screenshots are
        // consistent.
        await page.setViewportSize({width: 1920, height: 1080});

        // Expand the viewport as necessary to ensure the entire
        // configurator is visible.
        const lastControl = configurator.getSelect(
          'Output format',
          configurator.getConfigSection('Output settings'),
        );
        await ensureElementIsVisible(lastControl, page);

        // Take a screenshot of the configurator and compare it to the
        // golden image.
        expect(
          await page.locator('#configurator').screenshot(),
        ).toMatchSnapshot(`samplePrepopulate-${sampleName}.png`);
      });
    });
  }
});

/**
 * Resizes the viewport height until the specified element is
 * visible.
 *
 * @param elem
 * @param page
 * @returns
 */
async function ensureElementIsVisible(
  elem: Locator,
  page: Page,
): Promise<void> {
  const elemSize = await elem.boundingBox();
  const viewportSize = page.viewportSize()!;
  if (elemSize!.y + elemSize!.height > viewportSize.height) {
    await page.setViewportSize({
      width: viewportSize.width,
      height: viewportSize.height + 50,
    });
    return ensureElementIsVisible(elem, page);
  }
  return Promise.resolve();
}
