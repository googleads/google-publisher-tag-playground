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

import {ScriptTarget} from './typescript.js';

/**
 * Configuration options for a single custom GPT sample.
 */
export interface SampleConfig {
  page?: SamplePageConfig;
  slots: SampleSlotConfig[];
  template?: SampleTemplateConfig;
}

/**
 * Page-level GPT settings.
 */
export interface SamplePageConfig {
  /** @deprecated */
  adsense?: SampleAdSenseAttributeConfig;
  config?: googletag.config.PageSettingsConfig;
  privacy?: SamplePrivacyConfig;
  /** @deprecated */
  sra?: boolean;
  /** @deprecated */
  targeting?: SampleTargetingKV[];
}

/**
 * AdSense attributes.
 */
export interface SampleAdSenseAttributeConfig {
  pageUrl?: string;
}

/**
 * Privacy-related GPT settings.
 */
export interface SamplePrivacyConfig {
  ltd?: boolean;
  npa?: boolean;
  rdp?: boolean;
  tfcd?: boolean;
  tfua?: boolean;
}

/**
 * Settings related to a single GPT ad slot.
 */
export interface SampleSlotConfig {
  adUnit: string;
  config?: googletag.config.SlotSettingsConfig;
  format?: keyof typeof googletag.enums.OutOfPageFormat;
  size: googletag.GeneralSize;
  /** @deprecated */
  targeting?: SampleTargetingKV[];
}

/**
 * Represents a single targeting key-value.
 */
export interface SampleTargetingKV {
  key: string;
  value: string | string[];
}

/**
 * Custom sample template options.
 */
export interface SampleTemplateConfig {
  adSpacing?: number;
  type?: SampleTemplateType;
  target?: ScriptTarget;
}

/**
 * Custom sample template types.
 */
export enum SampleTemplateType {
  BASIC,
}
