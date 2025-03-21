/**
 * Copyright 2024 Google LLC
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

import {configureLocalization} from '@lit/localize';

import {
  allLocales,
  sourceLocale,
  targetLocales,
} from '../generated/locale-codes.js';

import {PlaygroundConfig} from './playground-config.js';

const localization = configureLocalization({
  sourceLocale,
  targetLocales,
  loadLocale: locale =>
    import(`${PlaygroundConfig.baseUrl}/locales/${locale}.js`),
});

/**
 * Return the currently configured locale.
 */
export const {getLocale} = localization;

/**
 * Safely sets a new locale.
 *
 * This method will log an error if an unsupported locale is specified.
 * @param newLocale
 */
export function setLocale(newLocale: string) {
  const targetLocale = (allLocales as readonly string[]).find(
    locale => locale.toLowerCase() === newLocale.toLowerCase(),
  );
  if (targetLocale) {
    console.info(`Loading supported locale: ${targetLocale}.`);
    void localization.setLocale(targetLocale);
  } else {
    console.error(`Unsupported locale specified: ${newLocale}.`);
  }
}
