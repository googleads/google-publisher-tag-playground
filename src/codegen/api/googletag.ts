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

import {msg, str} from '@lit/localize';

import {
  SampleConfig,
  SamplePageConfig,
  SampleSlotConfig,
} from '../../model/sample-config.js';
import {outOfPageFormatNames} from '../../model/settings.js';
import {sanitizeJs} from '../sanitize.js';

import * as config from './config.js';
import * as pubads from './pubads.js';
import * as slot from './slot.js';

/* Internal template strings */

const api = {
  cmdInit: () => 'window.googletag = window.googletag || {cmd: []}',
  cmdPush: (content: string) => `googletag.cmd.push(() => {${content}})`,
  declareSlot: (id: string) => `let ${id}: googletag.Slot|null`,
  defineSlot: (slot: SampleSlotConfig, id: string) =>
    `googletag.defineSlot(${sanitizeJs(
      slot.adUnit,
    )}, ${sanitizeJs(slot.size)}, '${id}')`,
  defineOutOfPageSlot: (slot: SampleSlotConfig) =>
    `googletag.defineOutOfPageSlot(${sanitizeJs(
      slot.adUnit,
    )}, googletag.enums.OutOfPageFormat.${String(slot.format)})`,
  display: (idOrSlot: string) => `googletag.display(${idOrSlot})`,
  enableServices: () => 'googletag.enableServices()',
  setConfig: (config: googletag.config.PageSettingsConfig) =>
    `googletag.setConfig(${JSON.stringify(config)})`,
};

const outOfPage = {
  comment: (format: string) =>
    msg(
      str`${
        format
      } slots return null if the page or device does not support them.`,
      {
        desc: 'Code comment: The specified out-of-page format may not be supported in all environments.',
      },
    ),
  loaded: (format: string) =>
    msg(str`${format} is loaded.`, {
      desc: 'Status message: An ad slot of the specified format has loaded.',
    }),
  loadedNeedScroll: (format: string) =>
    msg(str`${outOfPage.loaded(format)} Scroll page to activate.`, {
      desc: 'Status message: Users must scroll the page to activate an out-of-page ad.',
    }),
  loadedUrl: (format: string) =>
    `<a href="https://www.example.com">${outOfPage.loaded(format)}</a>`,
  loading: (format: string) =>
    msg(str`${format} is loading...`, {
      desc: 'Status message: An out-of-page ad is loading.',
    }),
  notSupported: (format: string) =>
    msg(str`${format} is not supported on this page.`, {
      desc: 'Status message: The specified out-of-page format is not supported on the current page.',
    }),
};

const status = {
  container: (id: string) => `document.getElementById('${id}')`,
  update: (id: string, content: string) =>
    `${status.container(id)}!.innerText = '${content}'`,
  updateHtml: (id: string, content: string) =>
    `${status.container(id)}!.innerHTML = '${content}'`,
};

/* Internal helper methods */

/**
 * Generates a slotOnload event callback function body for the
 * specified slot.
 */
function getSlotOnloadCallback(
  sampleConfig: SampleConfig,
  slotConfig: SampleSlotConfig,
) {
  const id = getSlotIdentifer(sampleConfig, slotConfig);
  const formatStr = outOfPageFormatNames[slotConfig.format!]();

  let statusUpdate = '';
  switch (slotConfig.format) {
    case 'INTERSTITIAL':
      statusUpdate = status.updateHtml(id, outOfPage.loadedUrl(formatStr));
      break;
    case 'TOP_ANCHOR':
      statusUpdate = status.update(id, outOfPage.loadedNeedScroll(formatStr));
      break;
    default:
      statusUpdate = status.update(id, outOfPage.loaded(formatStr));
  }

  return `
    if(${id} === event.slot) {
      ${statusUpdate};
    }
  `;
}

/* Public exports */

/**
 * CommandArray related API functionality.
 */
export const cmd = {
  init: () => api.cmdInit() + ';',
  push: (content: string) => api.cmdPush(content) + ';',
};

/**
 * Generates code for enabling services.
 */
export function enableServices() {
  return api.enableServices() + ';';
}

/**
 * Generates code for declaring a variable which will hold a refrence
 * to the specified slot.
 *
 * This must be called before defining an out-of-page slot, since the
 * reference is needed to support error checking.
 *
 * @param sampleConfig The sample config.
 * @param slotConfig The slot within this config to generate a declaration for.
 * @returns
 */
export function declareSlot(
  sampleConfig: SampleConfig,
  slotConfig: SampleSlotConfig,
) {
  return api.declareSlot(getSlotIdentifer(sampleConfig, slotConfig)) + ';';
}

/**
 * Generates code for defining a single (static) ad slot.
 *
 * @param sampleConfig The sample config.
 * @param slotConfig The slot within this config to define.
 * @returns
 */
export function defineSlot(
  sampleConfig: SampleConfig,
  slotConfig: SampleSlotConfig,
) {
  const slotDef =
    api.defineSlot(slotConfig, getSlotIdentifer(sampleConfig, slotConfig)) +
    '!';
  return slot.addInlineSlotSettings(slotConfig, slotDef);
}

/**
 * Generates code for defining a single out-of-page ad slot.
 *
 * @param sampleConfig The sample config.
 * @param slotConfig The slot within this config to define.
 * @returns
 */
export function defineOutOfPageSlot(
  sampleConfig: SampleConfig,
  slotConfig: SampleSlotConfig,
) {
  const slotVar = getSlotIdentifer(sampleConfig, slotConfig);

  const formatString = outOfPageFormatNames[slotConfig.format!]();
  return `
    ${slotVar} = ${api.defineOutOfPageSlot(slotConfig)};

    // ${outOfPage.comment(formatString)}
    if(!${slotVar}) {
      ${status.update(slotVar, `${outOfPage.notSupported(formatString)}`)};
    } else {
      ${slot.addInlineSlotSettings(slotConfig, slotVar)};

      ${status.update(slotVar, `${outOfPage.loading(formatString)}`)};

      ${pubads.addEventListener(
        'slotOnload',
        getSlotOnloadCallback(sampleConfig, slotConfig),
      )}
    }
  `.trim();
}

/**
 * Generates code for requesting and rendering a single ad slot.
 *
 * @param sampleConfig The sample config.
 * @param slotConfig The slot within this config to request/render.
 * @returns
 */
export function display(
  sampleConfig: SampleConfig,
  slotConfig: SampleSlotConfig,
) {
  const id = getSlotIdentifer(sampleConfig, slotConfig);
  const idOrSlot = slotConfig.format ? id : `'${id}'`;

  return slotConfig.format
    ? `if (${idOrSlot}) { ${api.display(idOrSlot)}; }`
    : `${api.display(idOrSlot)};`;
}

/**
 * Generates code for requesting/rendering all ad slots.
 *
 * @param sampleConfig The sample config.
 * @returns
 */
export function displayAll(sampleConfig: SampleConfig) {
  let displayAll = '';
  if (sampleConfig.page?.config?.singleRequest) {
    // Prefer a static slot, since OOP slots have a higher chance of being null.
    let index = sampleConfig.slots.findIndex(
      (s: SampleSlotConfig) => !s.format,
    );
    if (index === -1) index = sampleConfig.slots.length - 1;
    displayAll = display(sampleConfig, sampleConfig.slots[index]);
  } else {
    sampleConfig.slots.forEach((slot: SampleSlotConfig) => {
      displayAll += display(sampleConfig, slot);
    });
  }

  return displayAll;
}

/**
 * Generates code for setting page-level config.
 *
 * @param pageConfig The current page config.
 * @returns
 */
export function setConfig(pageConfig: SamplePageConfig) {
  let cleanConfig;

  if (pageConfig.config) {
    cleanConfig = config.pageConfig(pageConfig.config);
  }

  return cleanConfig ? api.setConfig(cleanConfig) + ';' : '';
}

/**
 * Returns a unique identifier for the specified slot.
 *
 * This identifier can be used to refer to the slot.
 *
 * @param sampleConfig The sample config.
 * @param slotConfig The slot within this config to return an identifier for.
 * @returns
 */
export function getSlotIdentifer(
  sampleConfig: SampleConfig,
  slotConfig: SampleSlotConfig,
) {
  return `slot${sampleConfig.slots.indexOf(slotConfig) + 1}`;
}
