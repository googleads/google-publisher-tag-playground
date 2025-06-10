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

import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import {importMetaAssets} from '@web/rollup-plugin-import-meta-assets';
import glob from 'glob';
import copy from 'rollup-plugin-copy';
import minifyHTML from 'rollup-plugin-minify-html-literals';

const MINIFY_HTML_OPTIONS = {
  options: {
    shouldMinifyCSS: template => {
      return (
        template.tag &&
        template.tag === 'css' &&
        // Skip any CSS containing statements that are unsupported
        // by the version of clean-css this plugin is locked to.
        !template.parts.some(part => part.text.match('@layer'))
      );
    },
  },
};

const TERSER_OPTIONS = {
  warnings: true,
  ecma: 2020,
  compress: {
    unsafe: true,
    passes: 2,
  },
  output: {
    // Allow @license and @preserve in output.
    comments: 'some',
    inline_script: false,
  },
};

// Process direct includes individually to ensure they're bundled with all dependencies.
const includes = glob.sync('site/includes/*.js').map(include => {
  return {
    input: include,
    output: {
      dir: 'dist/includes/',
      format: 'es',
    },
    plugins: [
      resolve(),
      minifyHTML(MINIFY_HTML_OPTIONS),
      terser(TERSER_OPTIONS),
    ],
  };
});

// Process locale files individually to ensure they aren't chunked together.
const locales = glob.sync('src/generated/locales/*.js').map(locale => {
  return {
    input: locale,
    output: {
      dir: 'dist/locales/',
      format: 'es',
    },
    plugins: [resolve(), terser(TERSER_OPTIONS)],
  };
});

export default [
  {
    input: glob.sync('site/js/*.js'),
    output: {
      dir: 'dist/js',
      format: 'es',
      // Manually split dependencies into logical chunks, to aid debugging.
      manualChunks: id => {
        const lib = id.replace(/^.*\\node_modules\\/, '');
        if (lib.startsWith('lit')) {
          return 'lit';
        }
        if (lib.startsWith('playground')) {
          return 'playground-elements';
        }
        if (lib.startsWith('prettier')) {
          return 'prettier';
        }
        if (lib.startsWith('typescript')) {
          return 'typescript';
        }
      },
      chunkFileNames: '[name].js',
    },
    plugins: [
      // Convert typescript from CJS -> ESM.
      // Ignore all `requires`, rather than including polyfills we won't use.
      commonjs({
        include: 'node_modules/typescript/lib/typescript.js',
        ignore: () => true,
      }),
      resolve(),
      importMetaAssets(),
      minifyHTML(MINIFY_HTML_OPTIONS),
      copy({
        targets: [
          {
            src: ['site/*', '!site/includes', '!site/js'],
            dest: 'dist',
          },
        ],
        flatten: false,
      }),
      terser(TERSER_OPTIONS),
    ],
  },
  ...includes,
  ...locales,
];
