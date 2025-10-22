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

import {SampleConfig, SampleSlotConfig} from '../../model/sample-config.js';
import {PlaygroundConfig} from '../../util/playground-config.js';

/**
 * Provides supplementary code to support GPT API samples.
 */
export abstract class SampleHelper {
  private static readonly staticCodeCache = new Map<string, string>();

  /**
   * Retrieves code stored in a static include file.
   *
   * @param staticIncludeFile Name of a file stored under `/includes`.
   * @returns The contents of the specified file.
   */
  protected async fetchStaticInclude(staticIncludeFile: string) {
    if (!SampleHelper.staticCodeCache.has(staticIncludeFile)) {
      SampleHelper.staticCodeCache.set(
        staticIncludeFile,
        await fetch(`${PlaygroundConfig.baseUrl}/includes/${staticIncludeFile}`)
          .then(response => response.text())
          .then(contents =>
            // Remove the license header, if present.
            contents.replace(/\/\*\*.*?\*\//s, '').trim(),
          ),
      );
    }

    return SampleHelper.staticCodeCache.get(staticIncludeFile)!;
  }

  /**
   * Public exports that should be imported by calling code.
   */
  public abstract exports(): string[];

  /**
   * Declarations that should be included in the global scope.
   */
  public abstract globalDeclarations(): string[];

  /**
   * Event listener declarations for the specified slot.
   *
   * @param config
   * @param slotConfig
   */
  public abstract slotEventListeners(
    config: SampleConfig,
    slotConfig: SampleSlotConfig,
  ): string[];

  /**
   * Utility code used by other members of this class.
   */
  public abstract utilities(): Promise<string[]>;
}
