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

import {Page} from '@playwright/test';

import {ScriptTarget} from '../../src/model/typescript.js';

import {expect, test} from './fixtures/configurator.js';

const PLAYGROUND_SELECTOR = 'gpt-playground';

const TARGET_SELECT_LABEL = 'Output format';

test.describe('Output format configuration', () => {
  async function assertTypeScript(page: Page) {
    const playground = page.locator(PLAYGROUND_SELECTOR);
    await expect(playground).toContainText('index.html');
    await expect(playground).toContainText('sample.ts');
  }

  async function assertJavaScript(page: Page, legacyJS = false) {
    const playground = page.locator(PLAYGROUND_SELECTOR);
    await expect(playground).toContainText('index.html');
    await expect(playground).not.toContainText('sample.ts');
    await expect(playground).toContainText(legacyJS ? 'function' : '() =>');
    await expect(playground).not.toContainText(legacyJS ? '() =>' : 'function');
  }

  test('Default is TS', async ({configurator, page}) => {
    await expect(configurator.getSelect(TARGET_SELECT_LABEL)).toBeVisible();
    await assertTypeScript(page);
  });

  test('Selecting JS changes output files', async ({configurator, page}) => {
    const targetSelect = configurator.getSelect(TARGET_SELECT_LABEL);
    await expect(targetSelect).toBeVisible();
    await configurator.selectOption(targetSelect, 'ES2020');
    await assertJavaScript(page);
  });

  test('Selecting ES5 generates legacy JS', async ({configurator, page}) => {
    const targetSelect = configurator.getSelect(TARGET_SELECT_LABEL);
    await expect(targetSelect).toBeVisible();
    await configurator.selectOption(targetSelect, 'ES5');
    await assertJavaScript(page, true);
  });

  test('Selecting ES2020 generates modern JS', async ({configurator, page}) => {
    const targetSelect = configurator.getSelect(TARGET_SELECT_LABEL);
    await expect(targetSelect).toBeVisible();
    await configurator.selectOption(targetSelect, 'ES2020');
    await assertJavaScript(page);
  });

  test.describe('Prepopulating ES5', () => {
    test.use({
      config: {
        slots: [],
        template: {
          target: ScriptTarget.ES5,
        },
      },
    });

    test('Generates legacy JS', async ({configurator, page}) => {
      const targetSelect = configurator.getSelect(TARGET_SELECT_LABEL);
      await expect(targetSelect).toBeVisible();
      await expect(
        configurator.getSelectOption(targetSelect, 'ES5'),
      ).toBeSelected();
      await assertJavaScript(page, true);
    });
  });

  test.describe('Prepopulating ES2020', () => {
    test.use({
      config: {
        slots: [],
        template: {
          target: ScriptTarget.ES2020,
        },
      },
    });

    test('Generates modern JS', async ({configurator, page}) => {
      const targetSelect = configurator.getSelect(TARGET_SELECT_LABEL);
      await expect(targetSelect).toBeVisible();
      await expect(
        configurator.getSelectOption(targetSelect, 'ES2020'),
      ).toBeSelected();
      await assertJavaScript(page);
    });
  });
});
