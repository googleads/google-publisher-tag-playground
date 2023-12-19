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

type Primitive = number|string|boolean;
type Sanitizable =
    Primitive|readonly Sanitizable[]|{readonly [key: string]: Sanitizable};

/**
 * Sanitize a user-provided value for inclusion in JS output.
 */
export function sanitizeJs(value: Sanitizable): string {
  // Adapted from
  // https://github.com/google/safevalues/blob/56278f779e155f9200052a2107870f7cfbd5100a/src/builders/script_builders.ts#L48C17-L48C30
  return JSON.stringify(value).replace(/</g, '\\u003C');
}