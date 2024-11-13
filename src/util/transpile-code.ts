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

import ts from 'typescript';

const PLACEHOLDER_COMMENT = '/* NEW_LINE_PLACEHOLDER */';

const TSC_OPTIONS: ts.CompilerOptions = {
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
  pretty: true,
};

function toggleBlankLines(source: string) {
  return source.includes(PLACEHOLDER_COMMENT)
    ? source.replaceAll(PLACEHOLDER_COMMENT, '\n')
    : source.replaceAll('\n\n', `\n${PLACEHOLDER_COMMENT}`);
}

/**
 * Transpiles a TypeScript string to JavaScript.
 *
 * @param source A string of TypeScript.
 * @param target The output JavaScript target.
 * @returns
 */
export function tsToJs(source: string, target = ts.ScriptTarget.ES2020) {
  const js = ts.transpileModule(toggleBlankLines(source), {
    compilerOptions: {...TSC_OPTIONS, target},
  }).outputText;

  return toggleBlankLines(js);
}
