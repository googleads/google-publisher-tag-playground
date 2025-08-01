/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  SampleConfig,
  SamplePageConfig,
  SampleSlotConfig,
} from '../model/sample-config.js';

/**
 * Migrate deprecated {@link SampleConfig} properties to supported alternatives.
 *
 * Note that this method modifies the provided {@link SampleConfig} object in
 * place.
 *
 * @param config
 * @returns The provided {@link SampleConfig} object.
 */
export function migrateLegacyProperties(config: SampleConfig) {
  if (config.page) migrateLegacyPageSettings(config.page);
  config.slots?.forEach(slot => migrateLegacySlotSettings(slot));

  return config;
}

function migrateLegacyPageSettings(page: SamplePageConfig) {
  // Ensure page config is initialized.
  page.config ||= {};

  if (page.adsense) {
    page.config.adsenseAttributes ||= {};
    page.config.adsenseAttributes.page_url = page.adsense.pageUrl;
  }

  if (page.sra) {
    page.config.singleRequest = page.sra;
  }

  if (page.targeting) {
    page.config.targeting = Object.fromEntries(
      page.targeting.map(kv => [kv.key, kv.value]),
    );
  }

  // Remove deprecated properties.
  delete page.adsense;
  delete page.sra;
  delete page.targeting;
}

function migrateLegacySlotSettings(slot: SampleSlotConfig) {
  // Ensure slot config is initialized.
  slot.config ||= {};

  if (slot.targeting) {
    slot.config.targeting = Object.fromEntries(
      slot.targeting.map(kv => [kv.key, kv.value]),
    );
  }

  delete slot.targeting;
}
