/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {isEmpty, isObject, isUndefined} from 'lodash-es';

/* Internal helper methods */

/**
 * Prunes all undefined config properties.
 *
 * This method recurses through all nested config objects, removing
 * any that become empty due to pruning.
 *
 * The provided object is modified in place.
 *
 * @param obj
 * @returns
 */
function removeEmptyConfigs(obj: Object) {
  let key: keyof typeof obj;
  for (key in obj) {
    const value = obj[key];
    if (
      isUndefined(value) ||
      (isObject(value) && isEmpty(removeEmptyConfigs(value)))
    ) {
      delete obj[key];
    }
  }

  return obj;
}

/* Public exports */

/**
 * Generates a clean {@link googletag.config.PageSettingsConfig}
 * from a provided config object.
 *
 * @param config
 * @returns
 */
export function pageConfig(config: googletag.config.PageSettingsConfig) {
  // Copy only the settings that we explicitly support.
  const cleanConfig: googletag.config.PageSettingsConfig = {
    adsenseAttributes: {
      page_url: config.adsenseAttributes?.page_url,
    },
    categoryExclusion: config.categoryExclusion,
    collapseDiv: config.collapseDiv,
    disableInitialLoad: config.disableInitialLoad,
    privacyTreatments: config.privacyTreatments,
    singleRequest: config.singleRequest,
    targeting: config.targeting,
  };

  // Remove undefined properties and empty nested configs.
  removeEmptyConfigs(cleanConfig);

  return isEmpty(cleanConfig) ? null : cleanConfig;
}

/**
 * Generates a clean {@link googletag.config.SlotSettingsConfig}
 * from a provided config object.
 *
 * @param config
 * @returns
 */
export function slotConfig(config: googletag.config.SlotSettingsConfig) {
  // Copy only the settings that we explicitly support.
  const cleanConfig: googletag.config.SlotSettingsConfig = {
    categoryExclusion: config.categoryExclusion,
    collapseDiv: config.collapseDiv,
    interstitial: {
      requireStorageAccess: config.interstitial?.requireStorageAccess,
      triggers: {
        navBar: config.interstitial?.triggers?.navBar,
        unhideWindow: config.interstitial?.triggers?.unhideWindow,
      },
    },
    targeting: config.targeting,
  };

  // Remove undefined properties and empty nested configs.
  removeEmptyConfigs(cleanConfig);

  return isEmpty(cleanConfig) ? null : cleanConfig;
}
