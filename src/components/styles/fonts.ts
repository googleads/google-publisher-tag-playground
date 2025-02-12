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

import {css} from 'lit';

/**
 * Font styles that mimic developers.google.com
 */
export const fontStyles = css`
  :host {
    font: var(--standard-font);

    --code-font: 500 var(--code-font-size) / 1em var(--code-font-family);
    --code-font-family: Roboto Mono, monospace;
    --code-font-size: 90%;

    --title-font: 500 16px/24px var(--title-font-family);
    --title-font-family:
      Google Sans, Noto Sans, Noto Sans JP, Noto Sans KR, Noto Naskh Arabic,
      Noto Sans Thai, Noto Sans Hebrew, Noto Sans Bengali, sans-serif;

    --standard-font: 400 16px/24px var(--standard-font-family);
    --standard-font-family:
      Roboto, Noto Sans, Noto Sans JP, Noto Sans KR, Noto Naskh Arabic,
      Noto Sans Thai, Noto Sans Hebrew, Noto Sans Bengali, sans-serif;

    -webkit-font-smoothing: antialiased;
  }
`;
