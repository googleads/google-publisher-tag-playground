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

import {msg} from '@lit/localize';

import {SampleConfig, SampleSlotConfig} from '../model/sample-config.js';
import {formatTypeScript} from '../util/format-code.js';

import * as googletag from './api/googletag.js';
import * as pubads from './api/pubads.js';

/* Internal template strings */

const strings = {
  staticSlotComment: () =>
    msg('// Define static ad slots.', {
      desc: 'Code comment preceding ad slot definitions.',
    }),
  outOfPageSlotComment: () =>
    msg('// Define out-of-page slots.', {
      desc: 'Code comment preceding out-of-page ad slot definitions.',
    }),
  enableServicesComment: () =>
    msg('// Enable GPT services.', {
      desc: 'Code comment preceding a call to googletag.enableServices().',
    }),
  pageSettingsComment: () =>
    msg('// Configure page-level settings.', {
      desc: 'Code comment preceding page-level configuration.',
    }),
  privacySettingsComment: () =>
    msg('// Configure privacy settings.', {
      desc: 'Code comment preceding privacy settings configuration.',
    }),
  requestAdsComment: () =>
    msg('// Request and render all previously defined ad slots.', {
      desc: 'Code comment preceding a call to googletag.display().',
    }),
};

/* Internal helper methods */

function globalSlotDeclarations(config: SampleConfig) {
  return config.slots
    .map((slot: SampleSlotConfig) => {
      return slot.format ? googletag.declareSlot(config, slot) : '';
    })
    .filter(v => v !== '')
    .join('\n');
}

function slotDefinitions(config: SampleConfig, outOfPage = false) {
  let slotDefs = '';

  config.slots.forEach((slot: SampleSlotConfig) => {
    if (!outOfPage && !slot.format) {
      slotDefs += googletag.defineSlot(config, slot) + '\n';
    } else if (outOfPage && slot.format) {
      slotDefs += googletag.defineOutOfPageSlot(config, slot) + '\n\n';
    }
  });

  return slotDefs;
}

function requestAds(config: SampleConfig) {
  return `
    ${config.slots.length > 0 ? strings.requestAdsComment() : ''}
    ${config.slots.length > 0 ? googletag.displayAll(config) : ''}
  `.trim();
}

function initGpt(config: SampleConfig, requestAndRenderAds: boolean) {
  const staticSlots = slotDefinitions(config);
  const outOfPageSlots = slotDefinitions(config, true);

  const pageSettings = googletag.setConfig(config.page || {});
  const privacySettings = pubads.setPrivacySettings(config.page?.privacy || {});

  return `
    ${staticSlots.length > 0 ? strings.staticSlotComment() : ''}
    ${staticSlots}

    ${outOfPageSlots.length > 0 ? strings.outOfPageSlotComment() : ''}
    ${outOfPageSlots}

    ${privacySettings.length > 0 ? strings.privacySettingsComment() : ''}
    ${privacySettings}

    ${pageSettings.length > 0 ? strings.pageSettingsComment() : ''}
    ${pageSettings}

    ${strings.enableServicesComment()}
    ${googletag.enableServices()}

    ${requestAndRenderAds ? requestAds(config) : ''}
  `
    .replace(/\\n{3,}/g, '\n\n')
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
  config: SampleConfig,
  slot: SampleSlotConfig,
) {
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
  config: SampleConfig,
  requestAndRenderAds = true,
) {
  const initCode = `
    ${googletag.cmd.init()}

    ${globalSlotDeclarations(config)}

    ${googletag.cmd.push(initGpt(config, requestAndRenderAds))}
  `
    .replace(/\\n{3,}/g, '\n\n')
    .trim();

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
