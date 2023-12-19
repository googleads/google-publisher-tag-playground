/**
 * Copyright 2023 Google LLC
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

import {SampleConfig, SampleSlotConfig} from '../model/sample-config.js';
import {formatTypeScript} from '../util/format-code.js';

import * as googletag from './api/googletag.js';
import * as pubads from './api/pubads.js';

/* Internal template strings */

const STATIC_SLOT_COMMENT = '// Define static ad slots.';
const OUT_OF_PAGE_SLOT_COMMENT = '// Define out of page slots.';
const ENABLE_SERVICES_COMMENT = '// Enable GPT services.';
const ENABLE_SRA_COMMENT = '// Enable single request mode.';
const PAGE_TARGETING_COMMENT = '//Configure page-level targeting.';
const PRIVACY_SETTINGS_COMMENT = '// Configure privacy settings.';
const REQUEST_ADS_COMMENT =
    '// Request and render all previously defined ad slots.';

/* Internal helper methods */

function globalSlotDeclarations(config: SampleConfig) {
  return config.slots
      .map((slot: SampleSlotConfig) => {
        return slot.format ? googletag.declareSlot(config, slot) : '';
      })
      .filter((v) => v !== '')
      .join('\n');
}

function slotDefinitions(config: SampleConfig, outOfPage = false) {
  let slotDefs = '';

  config.slots.forEach((slot: SampleSlotConfig, i) => {
    if (!outOfPage && !slot.format) {
      slotDefs += googletag.defineSlot(config, slot) + '\n';
    } else if (outOfPage && slot.format) {
      slotDefs += googletag.defineOutOfPageSlot(config, slot) + '\n';
    }
  });

  return slotDefs;
}

function requestAds(config: SampleConfig) {
  return `
    ${config.slots.length > 0 ? REQUEST_ADS_COMMENT : ''}
    ${config.slots.length > 0 ? googletag.displayAll(config) : ''}
  `.trim();
}

function initGpt(config: SampleConfig, requestAndRenderAds: boolean) {
  const staticSlots = slotDefinitions(config);
  const outOfPageSlots = slotDefinitions(config, true);

  const pageTargeting = pubads.setTargeting(config.page?.targeting || []);
  const privacySettings = pubads.setPrivacySettings(config.page?.privacy || {});

  return `
    ${staticSlots.length > 0 ? STATIC_SLOT_COMMENT : ''}
    ${staticSlots}

    ${outOfPageSlots.length > 0 ? OUT_OF_PAGE_SLOT_COMMENT : ''}
    ${outOfPageSlots}

    ${privacySettings.length > 0 ? PRIVACY_SETTINGS_COMMENT : ''}
    ${privacySettings}

    ${pageTargeting.length > 0 ? PAGE_TARGETING_COMMENT : ''}
    ${pageTargeting}

    ${config.page?.sra ? ENABLE_SRA_COMMENT : ''}
    ${config.page?.sra ? pubads.enableSingleRequest() : ''}

    ${ENABLE_SERVICES_COMMENT}
    ${googletag.enableServices()}

    ${requestAndRenderAds ? requestAds(config) : ''}
  `.replace(/\\n{3,}/g, '\n\n')
      .trim();
}

/* Public exports */

/**
 * Retrieves a unique identifier for the specified slot.
 *
 * @param config The sample config.
 * @param slot A slot within the config to retrieve an identifier for.
 * @returns
 */
export function getSlotContainerId(
    config: SampleConfig, slot: SampleSlotConfig) {
  return googletag.getSlotIdentifer(config, slot);
}

/**
 * Generates code necessary to define ad slots and initialize GPT.
 *
 * @param config The sample config.
 * @param requestAndRenderAds Whether or not to include code for
 *     requesting/rendering ads.
 * @returns
 */
export async function initializeGpt(
    config: SampleConfig, requestAndRenderAds = true) {
  const initCode = `
    ${googletag.cmd.init()}

    ${globalSlotDeclarations(config)}

    ${googletag.cmd.push(initGpt(config, requestAndRenderAds))}
  `.replace(
       /\\n{3,}/g,
       '\n\n').trim();

  return await formatTypeScript(initCode);
}

/**
 * Generates code necessary to request/render ads.
 *
 * @param config The sample config.
 * @returns
 */
export async function requestAndRenderAds(config: SampleConfig) {
  const requestAndRenderAdsCode = googletag.cmd.push(requestAds(config));
  return await formatTypeScript(requestAndRenderAdsCode);
}