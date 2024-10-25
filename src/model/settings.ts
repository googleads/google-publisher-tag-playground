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

import {SampleConfig, SamplePageConfig, SamplePrivacyConfig, SampleTemplateConfig} from '../../src/model/sample-config.js';

/**
 * Maps {@link SampleConfig} properties to their friendly names.
 */
export const configNames: {[K in keyof SampleConfig]: string} = {
  page: 'Page settings',
  slots: 'Slot settings',
  template: 'Output settings',
};

/**
 * Maps {@link SamplePageConfig} properties to their friendly names.
 */
export const pageConfigNames: {[K in keyof SamplePageConfig]: string} = {
  privacy: 'Privacy',
  sra: 'Single Request Architecture (SRA)',
  targeting: 'Page-level targeting',
};

/**
 * Maps {@link SamplePrivacyConfig} properties to their friendly names.
 */
export const privacyConfigNames: {[K in keyof SamplePrivacyConfig]: string} = {
  ltd: 'Limited ads',
  npa: 'Non-personalized ads',
  rdp: 'Restrict data processing',
  tfcd: 'Child-directed treatment',
  tfua: 'Under the age of consent',
};

/**
 * Maps {@link SampleTemplateConfig} properties to their friendly names.
 */
export const templateConfigNames:
    {[K in keyof SampleTemplateConfig]: string} = {
      type: 'Sample template',
      target: 'Output format',
    };

/**
 * Maps `googletag.enums.OutOfPageFormat` keys to their friendly names.
 */
export const outOfPageFormatNames:
    {[K in keyof typeof googletag.enums.OutOfPageFormat]: string} = {
      BOTTOM_ANCHOR: 'Anchor ad (bottom)',
      TOP_ANCHOR: 'Anchor ad (top)',
      GAME_MANUAL_INTERSTITIAL: 'Gaming interstitial ad',
      REWARDED: 'Rewarded ad',
      LEFT_SIDE_RAIL: 'Side rail ad (left)',
      RIGHT_SIDE_RAIL: 'Side rail ad (right)',
      INTERSTITIAL: 'Web interstitial ad',
    };
