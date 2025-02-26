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
export const configNames: Record<keyof SampleConfig, () => string> = {
  page: () => msg('Page settings', {desc: 'Section containing page settings.'}),
  slots: () =>
    msg('Slot settings', {desc: 'Section containing ad slot settings.'}),
  template: () =>
    msg('Output settings', {
      desc: 'Section containing options to control output.',
    }),
};

/**
 * Maps {@link SamplePageConfig} properties to their friendly names.
 */
export const pageConfigNames: Record<keyof SamplePageConfig, () => string> = {
  privacy: () => msg('Privacy', {desc: 'Section containing privacy settings.'}),
  sra: () =>
    msg('Single Request Architecture (SRA)', {
      desc: 'Page-level setting label',
    }),
  targeting: () =>
    msg('Page-level targeting', {
      desc: 'Section containing page-level targeting options.',
    }),
};

/**
 * Maps {@link SamplePrivacyConfig} properties to their friendly names.
 */
export const privacyConfigNames: Record<
  keyof SamplePrivacyConfig,
  () => string
> = {
  // Order here defines the order of settings in the configurator.
  tfcd: () => msg('Child-directed treatment', {desc: 'Privacy setting label'}),
  ltd: () => msg('Limited ads', {desc: 'Privacy setting label'}),
  npa: () => msg('Non-personalized ads', {desc: 'Privacy setting label'}),
  rdp: () => msg('Restrict data processing', {desc: 'Privacy setting label'}),
  tfua: () => msg('Under the age of consent', {desc: 'Privacy setting label'}),
};

/**
 * Maps {@link SampleTemplateConfig} properties to their friendly names.
 */
export const templateConfigNames: Record<
  keyof SampleTemplateConfig,
  () => string
> = {
  type: () => msg('Sample template', {desc: 'Output template label'}),
  target: () => msg('Output format', {desc: 'Output format label'}),
};

/**
 * Maps `googletag.enums.OutOfPageFormat` keys to their friendly names.
 */
export const outOfPageFormatNames: Record<
  keyof typeof googletag.enums.OutOfPageFormat,
  () => string
> = {
  BOTTOM_ANCHOR: () =>
    msg('Anchor ad (bottom)', {desc: 'An out-of-page ad format'}),
  TOP_ANCHOR: () => msg('Anchor ad (top)', {desc: 'An out-of-page ad format'}),
  GAME_MANUAL_INTERSTITIAL: () =>
    msg('Gaming interstitial ad', {desc: 'An out-of-page ad format'}),
  REWARDED: () => msg('Rewarded ad', {desc: 'An out-of-page ad format'}),
  LEFT_SIDE_RAIL: () =>
    msg('Side rail ad (left)', {desc: 'An out-of-page ad format'}),
  RIGHT_SIDE_RAIL: () =>
    msg('Side rail ad (right)', {desc: 'An out-of-page ad format'}),
  INTERSTITIAL: () =>
    msg('Web interstitial ad', {desc: 'An out-of-page ad format'}),
};

/**
 * Maps `googletag.config.InterstitialConfig` properties to their friendly
 * names.
 */
export const interstitialConfigNames: Record<
  keyof googletag.config.InterstitialConfig,
  () => string
> = {
  triggers: () =>
    msg('Interstitial triggers', {
      desc: 'User actions that can trigger an intersitial ad.',
    }),
  requireStorageAccess: () =>
    msg('Require local storage consent', {
      desc: 'Whether user consent is required to access local storage.',
    }),
};

/**
 * Maps `googletag.config.InterstitialTrigger` values to their friendly names.
 */
export const interstitialTriggerNames: Record<
  googletag.config.InterstitialTrigger,
  () => string
> = {
  navBar: () =>
    msg('Browser navigation', {
      desc: 'The action of interacting with the browser navigation bar.',
    }),
  unhideWindow: () =>
    msg('Unhide window', {
      desc: 'The action of hiding and then returning to the page (for example, by switching tabs).',
    }),
};
