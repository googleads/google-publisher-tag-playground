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

import {SampleConfig, SampleSlotConfig} from '../../model/sample-config.js';
import {sanitizeJs} from '../sanitize.js';

import * as slot from './slot.js';

/* Internal template strings */

const api = {
  cmdInit: () => 'window.googletag = window.googletag || {cmd: []}',
  cmdPush: (content: string) => `googletag.cmd.push(() => {${content}})`,
  declareSlot: (id: string) => `let ${id}: googletag.Slot|null`,
  defineSlot: (slot: SampleSlotConfig, id: string) => `googletag.defineSlot(${
      sanitizeJs(slot.adUnit)}, ${sanitizeJs(slot.size)}, '${id}')`,
  defineOutOfPageSlot: (slot: SampleSlotConfig) =>
      `googletag.defineOutOfPageSlot(${
          sanitizeJs(slot.adUnit)}, googletag.enums.OutOfPageFormat.${
          String(slot.format)})`,
  display: (idOrSlot: string) => `googletag.display(${idOrSlot})`,
  enableServices: () => 'googletag.enableServices()',
};

/* Internal helper methods */

/**
 * Converts an out-of-page format enum value into a friendly string.
 *
 * Ex: BOTTOM_ANCHOR -> Bottom anchor
 */
function getFormatString(config: SampleSlotConfig) {
  return config.format ?
      `${String(config.format).charAt(0)}${
          String(config.format).slice(1).toLowerCase().replaceAll('_', ' ')}` :
      '';
}

/* Public exports */

/**
 * CommandArray related API functionality.
 */
export const cmd = {
  init: () => api.cmdInit() + ';',
  push: (content: string) => api.cmdPush(content) + ';'
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
 * @param config The sample config.
 * @param slotConfig The slot within this config to generate a declaration for.
 * @returns
 */
export function declareSlot(
    config: SampleConfig, slotConfig: SampleSlotConfig) {
  return api.declareSlot(getSlotIdentifer(config, slotConfig)) + ';';
}

/**
 * Generates code for defining a single (static) ad slot.
 *
 * @param config The sample config.
 * @param slotConfig The slot within this config to define.
 * @returns
 */
export function defineSlot(config: SampleConfig, slotConfig: SampleSlotConfig) {
  const slotDef =
      api.defineSlot(slotConfig, getSlotIdentifer(config, slotConfig)) + '!';
  return slot.addInlineSlotSettings(slotConfig, slotDef);
}

/**
 * Generates code for defining a single out-of-page ad slot.
 *
 * @param config The sample config.
 * @param slotConfig The slot within this config to define.
 * @returns
 */
export function defineOutOfPageSlot(
    config: SampleConfig, slotConfig: SampleSlotConfig) {
  const slotVar = getSlotIdentifer(config, slotConfig);
  const slotSettings = slot.addInlineSlotSettings(slotConfig, slotVar);

  const formatString = getFormatString(slotConfig);
  return `
    ${slotVar} = ${api.defineOutOfPageSlot(slotConfig)};

    // ${formatString} slots return null if the page or device does not support them.
    if(${slotVar}) {
      ${slotSettings};
    }
  `.trim();
}

/**
 * Generates code for requesting and rendering a single ad slot.
 *
 * @param config The sample config.
 * @param slotConfig The slot within this config to request/render.
 * @returns
 */
export function display(config: SampleConfig, slotConfig: SampleSlotConfig) {
  const id = getSlotIdentifer(config, slotConfig);
  const idOrSlot = slotConfig.format ? id : `'${id}'`;

  return slotConfig.format ? `if (${idOrSlot}) { ${api.display(idOrSlot)}; }` :
                             `${api.display(idOrSlot)};`;
}

/**
 * Generates code for requesting/rendering all ad slots.
 *
 * @param config The sample config.
 * @returns
 */
export function displayAll(config: SampleConfig) {
  let displayAll = '';
  if (config.page?.sra) {
    // Prefer a static slot, since OOP slots have a higher chance of being null.
    let index = config.slots.findIndex((s: SampleSlotConfig) => !s.format);
    if (index === -1) index = config.slots.length - 1;
    displayAll = display(config, config.slots[index]);
  } else {
    config.slots.forEach((slot: SampleSlotConfig, i) => {
      displayAll += display(config, slot);
    });
  }

  return displayAll;
}

/**
 * Returns a unique identifier for the specified slot.
 *
 * This identifier can be used to refer to the slot.
 *
 * @param config The sample config.
 * @param slotConfig The slot within this config to return an identifier for.
 * @returns
 */
export function getSlotIdentifer(
    config: SampleConfig, slotConfig: SampleSlotConfig) {
  return `slot${config.slots.indexOf(slotConfig)}`;
}