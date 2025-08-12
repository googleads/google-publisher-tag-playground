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

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

import {SampleConfig} from '../../src/model/sample-config.js';

import {expect, test} from './fixtures/configurator.js';

test.describe('Configurator screenshots', {tag: '@screenshot'}, () => {
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
        // Expand the viewport as necessary to ensure the entire
        // configurator is visible.
        const elemSize = await configurator
          .getConfigSection('Output settings')
          .boundingBox();
        await page.setViewportSize({
          width: page.viewportSize()!.width,
          height: elemSize!.y + elemSize!.height,
        });

        // Take a screenshot of the configurator and compare it to the
        // golden image.
        expect(
          await page.locator('#configurator').screenshot(),
        ).toMatchSnapshot(`samplePrepopulate-${sampleName}.png`);
      });
    });
  }
});
