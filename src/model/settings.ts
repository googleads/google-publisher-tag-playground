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

import {
  SampleConfig,
  SamplePageConfig,
  SamplePrivacyConfig,
  SampleTemplateConfig,
} from '../../src/model/sample-config.js';

/**
 * Maps {@link SampleConfig} properties to their friendly names.
 */
export const configNames: {[K in keyof SampleConfig]: () => string} = {
  page: () => msg('Page settings'),
  slots: () => msg('Slot settings'),
  template: () => msg('Output settings'),
};

/**
 * Maps {@link SamplePageConfig} properties to their friendly names.
 */
export const pageConfigNames: {[K in keyof SamplePageConfig]: () => string} = {
  privacy: () => msg('Privacy'),
  sra: () => msg('Single Request Architecture (SRA)'),
  targeting: () => msg('Page-level targeting'),
};

/**
 * Maps {@link SamplePrivacyConfig} properties to their friendly names.
 */
export const privacyConfigNames: {
  [K in keyof SamplePrivacyConfig]: () => string;
} = {
  ltd: () => msg('Limited ads'),
  npa: () => msg('Non-personalized ads'),
  rdp: () => msg('Restrict data processing'),
  tfcd: () => msg('Child-directed treatment'),
  tfua: () => msg('Under the age of consent'),
};

/**
 * Maps {@link SampleTemplateConfig} properties to their friendly names.
 */
export const templateConfigNames: {
  [K in keyof SampleTemplateConfig]: () => string;
} = {
  type: () => msg('Sample template'),
  target: () => msg('Output format'),
};

/**
 * Maps `googletag.enums.OutOfPageFormat` keys to their friendly names.
 */
export const outOfPageFormatNames: {
  [K in keyof typeof googletag.enums.OutOfPageFormat]: () => string;
} = {
  BOTTOM_ANCHOR: () => msg('Anchor ad (bottom)'),
  TOP_ANCHOR: () => msg('Anchor ad (top)'),
  GAME_MANUAL_INTERSTITIAL: () => msg('Gaming interstitial ad'),
  REWARDED: () => msg('Rewarded ad'),
  LEFT_SIDE_RAIL: () => msg('Side rail ad (left)'),
  RIGHT_SIDE_RAIL: () => msg('Side rail ad (right)'),
  INTERSTITIAL: () => msg('Web interstitial ad'),
};
