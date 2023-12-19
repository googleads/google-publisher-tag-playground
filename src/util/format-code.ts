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

import prettierPluginBabel from 'prettier/plugins/babel';
import prettierPluginEstree from 'prettier/plugins/estree';
import prettierPluginHtml from 'prettier/plugins/html';
import prettierPluginPostcss from 'prettier/plugins/postcss';
import prettierPluginTypescript from 'prettier/plugins/typescript';
import * as prettier from 'prettier/standalone';

/**
 * Format and prettify a provided TypeScript snippet.
 */
export async function formatTypeScript(content: string) {
  return await prettier.format(content, {
    parser: 'typescript',
    plugins: [prettierPluginTypescript, prettierPluginEstree],
    printWidth: 100
  });
}

/**
 * Format and prettify a provided HTML snippet.
 *
 * Supports formatting enbedded JS and CSS.
 */
export async function formatHtml(content: string) {
  return await prettier.format(content, {
    parser: 'html',
    plugins: [
      prettierPluginBabel, prettierPluginEstree, prettierPluginHtml,
      prettierPluginPostcss
    ],
    printWidth: 100
  });
}
