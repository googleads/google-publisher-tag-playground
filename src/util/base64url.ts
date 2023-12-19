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

/**
 * Encode a string to URL-safe Base64.
 *
 * Using URL and filename safe alphabet defined in
 * [RFC4648](https://datatracker.ietf.org/doc/html/rfc4648#section-5).
 */
export function encode(str: string) {
  // Convert string to UTF-8 bytes and encode as base64.
  // Adapted from https://developer.mozilla.org/en-US/docs/Glossary/Base64
  const bytes = new TextEncoder().encode(str);
  const base64 = btoa(String.fromCodePoint(...bytes));

  // Convert '+' -> '-', '/' to '_', and remove padding chars ('=').
  // Padding characters are not necessary for decode on modern browsers.
  return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

/**
 * Decode a URL-safe Base64 string.
 */
export function decode(str: string) {
  // Convert '-' -> '+', '_' -> '/'
  str = str.replaceAll('-', '+').replaceAll('_', '/');

  // Decode UTF-8 bytes and convert back to string.
  // Adapted from https://developer.mozilla.org/en-US/docs/Glossary/Base64
  const bytes = Uint8Array.from(atob(str), s => s.codePointAt(0)!);
  return new TextDecoder().decode(bytes);
}