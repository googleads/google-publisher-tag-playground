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
  SampleSlotConfig,
  SampleTemplateConfig,
} from '../../src/model/sample-config.js';

/** Placerholder function for unsupported properties. */
function notSupported(): string {
  throw new Error('Property not supported.');
}

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
  adsense: () =>
    msg('AdSense attributes', {
      desc: 'Settings that affect AdSense behavior.',
    }),
  config: () =>
    msg('Page-level configuration', {
      desc: 'Section containing page-level configuration settings.',
    }),
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
 * Maps {@link SampleSlotConfig} properties to their friendly names.
 */
export const slotConfigNames: Record<keyof SampleSlotConfig, () => string> = {
  adUnit: () => msg('Ad unit path', {desc: 'Ad unit path label'}),
  config: () =>
    msg('Slot-level configuration', {
      desc: 'Section containing slot-level configuration settings.',
    }),
  format: () => msg('Out-of-page format', {desc: 'Out-of-page format label'}),
  targeting: () =>
    msg('Targeting', {desc: 'Section containing ad targeting options.'}),
  size: () => msg('Sizes', {desc: 'Section containing ad sizing options.'}),
};

/**
 * Maps {@link googletag.config.PageSettingsConfig} properties to their friendly
 * names.
 */
export const pageSettingsConfigNames: Record<
  keyof googletag.config.PageSettingsConfig,
  () => string
> = {
  adsenseAttributes: pageConfigNames.adsense,
  adExpansion: notSupported,
  adYield: notSupported,
  categoryExclusion: () =>
    msg('Ad exclusion labels', {
      desc: 'Section containing ad exclusion labels.',
    }),
  centering: notSupported,
  collapseDiv: () =>
    msg('Collapse ad slots', {
      desc: 'Setting to control if/when ad slots should be collapsed (hidden).',
    }),
  disableInitialLoad: () =>
    msg('Disable initial load', {
      desc: 'Prevents GPT from requesting ads when calling display().',
    }),
  lazyLoad: notSupported,
  location: notSupported,
  pps: notSupported,
  privacyTreatments: () =>
    msg('Treatments', {desc: 'Setting to control privacy treatments'}),
  safeFrame: notSupported,
  singleRequest: pageConfigNames.sra,
  targeting: pageConfigNames.targeting,
  threadYield: notSupported,
  videoAds: notSupported,
};

/**
 * Maps {@link googletag.config.SlotSettingsConfig} properties to their friendly
 * names.
 */
export const slotSettingsConfigNames: Record<
  keyof googletag.config.SlotSettingsConfig,
  () => string
> = {
  adExpansion: notSupported,
  adsenseAttributes: notSupported,
  categoryExclusion: pageSettingsConfigNames.categoryExclusion,
  clickUrl: notSupported,
  collapseDiv: () =>
    msg('Collapse ad slot', {
      desc: 'Setting to control if/when a single ad slot should be collapsed (hidden).',
    }),
  componentAuction: notSupported,
  interstitial: () =>
    msg('Interstitial triggers', {
      desc: 'User actions that can trigger an intersitial ad.',
    }),
  safeFrame: notSupported,
  targeting: slotConfigNames.targeting,
};

/**
 * Maps {@link googletag.config.AdSenseAttributesConfig} properties to their
 * friendly names.
 */
export const adSenseAttributesConfigNames: Record<
  keyof googletag.config.AdSenseAttributesConfig,
  () => string
> = {
  adsense_ad_format: notSupported,
  adsense_channel_ids: notSupported,
  adsense_test_mode: notSupported,
  document_language: notSupported,
  page_url: () =>
    msg('Page URL', {
      desc: 'The page URL to associate with ad requests.',
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
  adSpacing: () =>
    msg('Ad spacing (% viewport)', {
      desc: 'The minimum amount of space to leave between ads, expressed as a percentage of the viewport.',
    }),
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
  AD_INTENTS: () => msg('Ad intents ad', {desc: 'An out-of-page ad format'}),
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
  triggers: slotSettingsConfigNames.interstitial,
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

/**
 * Maps {@link PrivacyTreatment} values to their friendly names.
 */
export const privacyTreatmentNames: Record<
  googletag.config.PrivacyTreatment,
  () => string
> = {
  disablePersonalization: () =>
    msg('Disable ads personalization', {
      desc: 'Setting to control ads personalization privacy treatment,',
    }),
};

/**
 * Maps {@link googletag.config.CollapseDivBehavior} values to their friendly
 * names.
 */
export const collapseDivNames: Record<
  googletag.config.CollapseDivBehavior,
  () => string
> = {
  DISABLED: () =>
    msg('Never', {
      desc: 'Setting indicating that ad slots will never be collapsed (hidden).',
    }),
  BEFORE_FETCH: () =>
    msg('Before requesting an ad', {
      desc: 'Setting indicating that ad slots will be collapsed (hidden) before requesting an ad.',
    }),
  ON_NO_FILL: () =>
    msg('If no ad is returned', {
      desc: 'Setting indicating that ad slots will be collapsed (hidden) if no ad is returned.',
    }),
};

/**
 * Maps {@link googletag.config.SafeFrameConfig} properties to their friendly
 * names.
 */
export const safeFrameConfigNames: Record<
  keyof googletag.config.SafeFrameConfig,
  () => string
> = {
  allowOverlayExpansion: notSupported,
  allowPushExpansion: notSupported,
  forceSafeFrame: () =>
    msg('Force SafeFrame', {
      desc: 'Setting to control whether ads should be forced to render using a SafeFrame container.',
    }),
  sandbox: notSupported,
  useUniqueDomain: notSupported,
};
