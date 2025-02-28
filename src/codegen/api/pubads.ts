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

import {
  SampleAdSenseAttributeConfig,
  SamplePrivacyConfig,
  SampleTargetingKV,
} from '../../model/sample-config.js';
import {sanitizeJs} from '../sanitize.js';

type GptEvent = keyof googletag.events.EventTypeMap;

/* Internal template strings */

const api = {
  pubAdsService: () => 'googletag.pubads()',
  addEventListener: (event: GptEvent, code: string) =>
    `${api.pubAdsService()}.addEventListener('${event}', (event) => {${code}})`,
  enableSingleRequest: () => `${api.pubAdsService()}.enableSingleRequest()`,
  setPrivacySettings: (settings: string) =>
    `${api.pubAdsService()}.setPrivacySettings({${settings}})`,
  setTargeting: (kv: SampleTargetingKV) =>
    `setTargeting(${sanitizeJs(kv.key)}, ${sanitizeJs(kv.value)})`,

  privacySetting: {
    ltd: (enabled: boolean) => `limitedAds: ${sanitizeJs(enabled)}`,
    npa: (enabled: boolean) => `nonPersonalizedAds: ${sanitizeJs(enabled)}`,
    rdp: (enabled: boolean) => `restrictDataProcessing: ${sanitizeJs(enabled)}`,
    tfcd: (enabled: boolean) =>
      `childDirectedTreatment: ${sanitizeJs(enabled)}`,
    tfua: (enabled: boolean) => `underAgeOfConsent: ${sanitizeJs(enabled)}`,
  },

  set: {
    pageUrl: (url: string) =>
      `${api.pubAdsService()}.set('page_url', ${sanitizeJs(url)})`,
  },
};

/* Public exports */

/**
 * Generates code for adding an event listener.
 *
 * @param event The {@link GptEvent} to listen for.
 * @param body The code to be executed when the event occurs.
 * @returns
 */
export function addEventListener(event: GptEvent, code: string) {
  return api.addEventListener(event, code);
}

/**
 * Generates code for enabling SRA mode.
 */
export function enableSingleRequest() {
  return api.enableSingleRequest() + ';';
}

/**
 * Generates code for setting AdSense attributes.
 */
export function setAdSenseAttributes(
  adSenseConfig: SampleAdSenseAttributeConfig,
) {
  const adSenseAttributes: string[] = [];

  if (adSenseConfig.pageUrl) {
    adSenseAttributes.push(api.set.pageUrl(adSenseConfig.pageUrl) + ';');
  }

  return adSenseAttributes.length > 0 ? adSenseAttributes.join('\n') : '';
}

/**
 * Generates code for configuring page-level privacy settings.
 *
 * @param privacy Privacy setting configuration object.
 * @returns
 */
export function setPrivacySettings(privacy: SamplePrivacyConfig) {
  const privacySettings: string[] = [];

  if (privacy?.ltd) {
    privacySettings.push(api.privacySetting.ltd(true));
  }
  if (privacy?.npa) {
    privacySettings.push(api.privacySetting.npa(true));
  }
  if (privacy?.rdp) {
    privacySettings.push(api.privacySetting.rdp(true));
  }
  if (privacy?.tfua) {
    privacySettings.push(api.privacySetting.tfua(true));
  }
  if (privacy?.tfcd) {
    privacySettings.push(api.privacySetting.tfcd(true));
  }

  return privacySettings.length > 0
    ? api.setPrivacySettings(privacySettings.join(',')) + ';'
    : '';
}

/**
 * Generates code for setting page-level targeting.
 *
 * @param targeting Page-level targeting configuration object.
 * @returns
 */
export function setTargeting(targeting: SampleTargetingKV[]) {
  const targetingKVs: string[] = [];

  targeting?.forEach((kv: SampleTargetingKV) => {
    targetingKVs.push('.' + api.setTargeting(kv));
  });

  return targetingKVs.length > 0
    ? api.pubAdsService() + targetingKVs.join('') + ';'
    : '';
}
