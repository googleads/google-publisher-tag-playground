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

import {SampleConfig} from '../model/sample-config.js';

import {BasicSample} from './basic-sample.js';
import {Template} from './template.js';

/**
 * Supported custom sample templates.
 */
export enum TemplateType {
  BASIC,
}

/**
 * Returns an appropriate {@link Template} instance for the specified
 * {@link SampleConfig}.
 */
export function createTemplate(config: SampleConfig): Template {
  const templateType = config.template?.type || TemplateType.BASIC;

  switch (templateType) {
    case TemplateType.BASIC:
      return new BasicSample(config, config.template?.target);
    default:
      throw new Error(`Unsupported template type: ${templateType}`);
  }
}
