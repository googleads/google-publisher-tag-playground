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

import {expect, Page, test} from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

import {encode} from '../../src/util/base64url.js';

// The last label in the configurator.
const LAST_LABEL = 'Output format';

test.describe('Configurator screenshots', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const CONFIG_DIR = path.resolve(__dirname, '../codegen-test-data/configs');

  const configs = fs.readdirSync(CONFIG_DIR);
  for (const config of configs) {
    if (path.extname(config) !== '.json') continue;

    const sample = fs.readFileSync(path.join(CONFIG_DIR, config), 'utf-8');
    const sampleName = config.replace('.json', '');

    test(`Sample config ${sampleName} prepopulates correctly.`, async ({
      page,
    }) => {
      await page.setViewportSize({width: 1920, height: 1080});
      await page.goto(`/configurator#config=${encode(sample)}`);
      await ensureLabelIsVisible(LAST_LABEL, page);
      expect(await page.locator('#configurator').screenshot()).toMatchSnapshot(
        `samplePrepopulate-${sampleName}.png`,
      );
    });
  }
});

/**
 * Resizes the viewport height until the specified configurator label is
 * visible.
 *
 * @param label
 * @param page
 * @returns
 */
async function ensureLabelIsVisible(label: string, page: Page): Promise<void> {
  const elem = page.getByLabel(label);
  const elemSize = await elem.boundingBox();
  const viewportSize = page.viewportSize()!;
  if (elemSize!.y + elemSize!.height > viewportSize.height) {
    await page.setViewportSize({
      width: viewportSize.width,
      height: viewportSize.height + 50,
    });
    return ensureLabelIsVisible(label, page);
  }
  return Promise.resolve();
}
