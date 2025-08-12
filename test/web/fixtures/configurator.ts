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

import {Locator, mergeExpects, Page, test as baseTest} from '@playwright/test';

import {SampleConfig} from '../../../src/model/sample-config.js';
import {encode} from '../../../src/util/base64url.js';

import {configuratorExpect} from './configurator-expect.js';

export const expect = mergeExpects(configuratorExpect);

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
      {waitUntil: 'commit'},
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

  /**
   * Returns configurator `chip-input` elements.
   */
  getChipInput(...titleHeirarchy: string[]) {
    return new ChipInput(this, this.getConfigSection(...titleHeirarchy));
  }

  /**
   * Returns the contents of the playground code editor.
   */
  async getCodeEditorContents() {
    const editor = this.page
      .locator('playground-code-editor')
      .locator('div.CodeMirror-code');
    return editor.textContent();
  }

  /**
   * Returns configurator select element(s).
   */
  getSelect(label: string, parent: Locator = this.page.locator('body')) {
    return parent.locator(`md-filled-select[label="${label}"]`);
  }

  /**
   * Returns configurator select option(s).
   */
  getSelectOption(selectElem: Locator, optionText: string) {
    return selectElem.locator('md-select-option').filter({hasText: optionText});
  }

  /**
   * Returns configurator text field element(s).
   */
  getTextField(label: string, parent: Locator = this.page.locator('body')) {
    return parent
      .locator(`md-filled-text-field[label="${label}"]`)
      .locator('input');
  }

  /**
   * Selects the specified option of the specified configurator select.
   *
   * This method asserts that the provided {@link Locator} points to a
   * valid configurator select element, and that the specified option
   * was actually selected.
   */
  async selectOption(selectElem: Locator, optionText: string) {
    // Ensure the provided selector actually points to a select element.
    expect(
      (await selectElem.evaluate(elem => elem.tagName)).toLowerCase(),
    ).toBe('md-filled-select');

    // Open the select.
    await selectElem.click();

    // Find the specified option and try to click it.
    const option = this.getSelectOption(selectElem, optionText);
    await option.click();

    // Ensure the option was actually selected.
    await expect(option).toBeSelected();
  }
}

export class ChipInput {
  constructor(
    private configurator: Configurator,
    public readonly input: Locator,
  ) {}

  /**
   * Attempts to add the provided value to this chip input.
   *
   * This method does not assert that the value was added successfuly.
   */
  async addValue(value: string) {
    await this.getTextField().fill(value);
    await this.getTextField().press('Enter');
  }

  async deleteValue(value: string) {
    await this.getChip(value).getByLabel('Remove').click();
  }

  async editValue(value: string) {
    await this.getChip(value).click();
  }

  /**
   * Returns the chip with the specified value.
   */
  getChip(value: string) {
    return this.input.locator(`md-input-chip[title="${value}"]`);
  }

  /**
   * Returns the text field associated with this chip input.
   */
  getTextField() {
    return this.input.locator('input[type="text"]');
  }

  /**
   * Returns the validation error associated with this chip input.
   */
  getValidationError() {
    return this.input.getByRole('alert');
  }
}
