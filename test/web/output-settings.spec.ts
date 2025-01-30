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

import {expect, Page, test} from '@playwright/test';
import {ScriptTarget} from 'typescript';

import {SampleConfig} from '../../src/model/sample-config.js';
import {encode} from '../../src/util/base64url.js';

const PLAYGROUND_SELECTOR = 'gpt-playground';
const TARGET_SELECTOR = 'select#target';

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

  test('Default is TS', async ({page}) => {
    await page.goto('/configurator');
    await expect(page.locator(TARGET_SELECTOR)).toBeVisible();
    await assertTypeScript(page);
  });

  test('Selecting JS changes output files', async ({page}) => {
    await page.goto('/configurator');
    await expect(page.locator(TARGET_SELECTOR)).toBeVisible();
    await page.locator(TARGET_SELECTOR).selectOption('ES2020');
    await assertJavaScript(page);
  });

  test('Selecting ES5 generates legacy JS', async ({page}) => {
    await page.goto('/configurator');
    await expect(page.locator(TARGET_SELECTOR)).toBeVisible();
    await page.locator(TARGET_SELECTOR).selectOption('ES5');
    await assertJavaScript(page, true);
  });

  test('Prepopulating ES5 generates legacy JS', async ({page}) => {
    const emptyES5Template = JSON.stringify({
      slots: [],
      template: {target: ScriptTarget.ES5},
    } as SampleConfig);

    await page.goto(`/configurator#config=${encode(emptyES5Template)}`);
    await expect(page.locator(TARGET_SELECTOR)).toBeVisible();
    await assertJavaScript(page, true);
  });

  test('Selecting ES2020 generates modern JS', async ({page}) => {
    await page.goto('/configurator');

    await expect(page.locator(TARGET_SELECTOR)).toBeVisible();
    await page.locator(TARGET_SELECTOR).selectOption('ES2020');
    await assertJavaScript(page);
  });

  test('Prepopulating ES2020 generates modern JS', async ({page}) => {
    const emptyES2020Template = JSON.stringify({
      slots: [],
      template: {target: ScriptTarget.ES2020},
    } as SampleConfig);

    await page.goto(`/configurator#config=${encode(emptyES2020Template)}`);
    await expect(page.locator(TARGET_SELECTOR)).toBeVisible();
    await assertJavaScript(page);
  });
});
