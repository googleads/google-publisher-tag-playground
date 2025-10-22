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
import {rewardedAdsHelper} from './helpers/rewarded-ad.js';
import {SampleHelper} from './helpers/sample-helper.js';

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
  registerSlotsComment: () =>
    msg('// Register all previously defined ad slots.', {
      desc: 'Code comment preceding call(s) to googletag.display().',
    }),
  requestAdsComment: () =>
    msg('// Request and render all previously defined ad slots.', {
      desc: 'Code comment preceding a call to googletag.display() or googletag.refresh().',
    }),
};

/* Internal helper methods */

function getHelpers(config: SampleConfig) {
  const helpers: SampleHelper[] = [];

  // Collect relevant helpers.
  if (config.slots.some(slot => slot.format && 'REWARDED' === slot.format)) {
    helpers.push(rewardedAdsHelper);
  }

  return helpers;
}

function globalDeclarations(config: SampleConfig) {
  return `
    ${globalSlotDeclarations(config)}

    ${globalHelperDeclarations(config)}
  `;
}

function globalHelperDeclarations(config: SampleConfig) {
  return config.slots.some(slot => slot.format && 'REWARDED' === slot.format)
    ? rewardedAdsHelper.globalDeclarations()
    : '';
}

function globalSlotDeclarations(config: SampleConfig) {
  return config.slots
    .map((slot: SampleSlotConfig) => {
      return slot.format ? googletag.declareSlot(config, slot) : '';
    })
    .filter(v => v !== '')
    .join('\n');
}

async function helperImports(config: SampleConfig, utilFilePath: string) {
  const imports = getHelpers(config).flatMap(helper => helper.exports());
  return imports.length > 0
    ? `import { ${imports.sort().join(',')} } from '${utilFilePath}';`
    : '';
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
  if (config.slots.length === 0) return '';

  if (config.page?.config?.disableInitialLoad) {
    return `
      ${strings.registerSlotsComment()}
      ${googletag.displayAll(config)}

      ${strings.requestAdsComment()}
      ${pubads.refresh()}
    `.trim();
  } else {
    return `
      ${strings.requestAdsComment()}
      ${googletag.displayAll(config)}
    `.trim();
  }
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
 * Whether or not the provided {@link SampleConfig} has associated
 * utility code.
 *
 * @param config The sample config.
 * @returns `true` if the config has associated utility code, `false` otherwise.
 */
export function hasUtilities(config: SampleConfig) {
  return getHelpers(config).length > 0;
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
  importFilePath?: string,
) {
  const initCode = `
    ${importFilePath ? await helperImports(config, importFilePath) : ''}

    ${googletag.cmd.init()}

    ${globalDeclarations(config)}

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

/**
 * Generates utility code necessary for the sample to run.
 *
 * @param config
 * @returns
 */
export async function sampleUtilities(config: SampleConfig) {
  const helperUtilities = (
    await Promise.all(getHelpers(config).map(helper => helper.utilities()))
  ).flat();

  return await formatTypeScript(helperUtilities.join('\n\n'));
}
