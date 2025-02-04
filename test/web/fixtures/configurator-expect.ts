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

import {expect, Locator} from '@playwright/test';

/**
 * Custom assertions for working with configurator elements in tests.
 */
export const configuratorExpect = expect.extend({
  /**
   * Ensures the {@link Locator} points to an enabled element.
   *
   * @param locator
   * @returns
   */
  async toBeEnabled(locator: Locator) {
    try {
      const tag = await locator.evaluate(elem => elem.tagName);
      await (tag.toLowerCase() === 'md-select-option'
        ? expect(locator).not.toHaveAttribute('disabled', /.*/)
        : expect(locator).toBeEnabled());

      return {
        pass: true,
        message: () => 'Expected element to be disabled, but it was enabled.',
      };
    } catch (e) {
      return {
        pass: false,
        message: () => 'Expected element to be enabled, but it was disabled.',
      };
    }
  },

  /**
   * Ensures the {@link Locator} points to a disabled element.
   *
   * @param locator
   * @returns
   */
  async toBeDisabled(locator: Locator) {
    try {
      const tag = await locator.evaluate(elem => elem.tagName);
      await (tag.toLowerCase() === 'md-select-option'
        ? expect(locator).toHaveAttribute('disabled', /.*/)
        : expect(locator).toBeDisabled());

      return {
        pass: true,
        message: () => 'Expected element to be enabled, but it was disabled.',
      };
    } catch (e) {
      return {
        pass: false,
        message: () => 'Expected element to be disabled, but it was enabled.',
      };
    }
  },

  /**
   * Ensures the {@link Locator} points to a selected option element.
   *
   * @param locator
   * @returns
   */
  async toBeSelected(locator: Locator) {
    try {
      expect((await locator.evaluate(elem => elem.tagName)).toLowerCase()).toBe(
        'md-select-option',
      );
      await expect(locator).toHaveAttribute('data-aria-selected', 'true');

      return {
        pass: true,
        message: () => 'Expected option to be unselected, but it was selected.',
      };
    } catch (e) {
      return {
        pass: false,
        message: () => 'Expected option to be selected, but it was unselected.',
      };
    }
  },
});
