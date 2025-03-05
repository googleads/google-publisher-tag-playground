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

import {window} from '../model/window.js';

/**
 * Safely retrieve the current URL hash parameters.
 */
function getUrlHashParameters() {
  return window.location.hash
    ? new URLSearchParams(window.location.hash.substring(1))
    : new URLSearchParams();
}

/**
 * Retrieve a parameter from the URL hash.
 */
export function getParameter(name: string): string | null {
  const params = getUrlHashParameters();
  return params.has(name) ? params.get(name) : null;
}

/**
 * Set a parameter in the URL hash.
 *
 * Note that this dynamically updates the browser URL to include the specified
 * parameter name and value in the URL hash. Any existing parameter with the
 * specified name will be overwritten.
 */
export function setParameter(
  name: string,
  value: string,
  hist: History = history,
) {
  const params = getUrlHashParameters();
  params.set(name, value);

  try {
    hist.replaceState(null, '', `#${params.toString()}`);
  } catch (ignored) {
    // Unable to set history, silently fail.
  }
}
