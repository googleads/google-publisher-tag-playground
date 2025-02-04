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

import {
  expect as baseExpect,
  Locator,
  mergeExpects,
  Page,
  test as baseTest,
} from '@playwright/test';

import {SampleConfig} from '../../../src/model/sample-config.js';
import {encode} from '../../../src/util/base64url.js';

export const expect = baseExpect;

export const test = baseTest.extend<{
  config: SampleConfig;
  configurator: Configurator;
}>({
  // Default, empty sample config object.
  // This can be overridden for specific tests via `test.use`.
  config: [{slots: []} as SampleConfig, {option: true}],

  configurator: async ({page, config}, use) => {
    const configurator = new Configurator(page);
    await configurator.goto(config);
    await use(configurator);
  },
});

export class Configurator {
  constructor(public readonly page: Page) {}

  async goto(config: SampleConfig) {
    await this.page.goto(
      `/configurator#config=${encode(JSON.stringify(config))}`,
    );
  }

  /**
   * Returns a config section by title.
   *
   * @param titleHeirarchy
   * An array of config section titles.
   * Each subsequent section is assumed to be nested inside of the previous.
   */
  getConfigSection(...titleHeirarchy: string[]) {
    return this.page.locator(
      titleHeirarchy.map(title => `config-section[title="${title}"]`).join(' '),
    );
  }

  /**
   * Returns configurator checkbox element(s).
   */
  getCheckbox(label: string, parent: Locator = this.page.locator('body')) {
    return parent
      .locator(`configurator-checkbox[label="${label}"]`)
      .locator('input');
  }
}
