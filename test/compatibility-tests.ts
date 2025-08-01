/**
 * Copyright 2025 Google LLC
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

import 'jasmine';

import {SampleConfig} from '../src/model/sample-config.js';
import {migrateLegacyProperties} from '../src/util/compatibility-utils.js';

describe('Compatibility utils', () => {
  describe('migrateLegacyProperties', () => {
    it('should not modify config with no legacy properties', () => {
      const config: SampleConfig = {
        page: {
          config: {
            singleRequest: true,
            targeting: {
              test: 'value',
            },
            adsenseAttributes: {
              page_url: 'https://www.example.com',
            },
          },
        },
        slots: [
          {
            adUnit: '',
            size: 'fluid',
            config: {
              targeting: {
                slot: 'one',
              },
            },
          },
        ],
      };
      const originalConfig = JSON.parse(JSON.stringify(config));

      migrateLegacyProperties(config);

      expect(config).toEqual(originalConfig);
    });

    it('should handle an empty config object', () => {
      const config: SampleConfig = {slots: []};
      migrateLegacyProperties(config);
      expect(config).toEqual({slots: []});
    });

    it('should handle a config with only slots', () => {
      const config: SampleConfig = {
        slots: [
          {adUnit: '', size: 'fluid', targeting: [{key: 'a', value: '1'}]},
        ],
      };
      migrateLegacyProperties(config);
      expect(config.slots[0].targeting).toBeUndefined();
      expect(config.slots[0].config?.targeting).toEqual({a: '1'});
    });

    it('should handle a config with only a page', () => {
      const config: SampleConfig = {
        page: {
          sra: true,
        },
        slots: [],
      };
      migrateLegacyProperties(config);
      expect(config.page?.sra).toBeUndefined();
      expect(config.page?.config?.singleRequest).toBeTrue();
    });

    describe('page properties', () => {
      it('should migrate sra property', () => {
        const config: SampleConfig = {
          page: {
            sra: true,
          },
          slots: [],
        };

        migrateLegacyProperties(config);

        expect(config.page?.sra).toBeUndefined();
        expect(config.page?.config?.singleRequest).toBeTrue();
      });

      it('should migrate adsense pageUrl property', () => {
        const config: SampleConfig = {
          page: {
            adsense: {
              pageUrl: 'https://www.example.com',
            },
          },
          slots: [],
        };

        migrateLegacyProperties(config);

        expect(config.page?.adsense).toBeUndefined();
        expect(config.page?.config?.adsenseAttributes?.page_url).toBe(
          'https://www.example.com',
        );
      });

      it('should migrate targeting property', () => {
        const config: SampleConfig = {
          page: {
            targeting: [
              {key: 'test', value: 'value'},
              {key: 'test2', value: 'value2'},
            ],
          },
          slots: [],
        };

        migrateLegacyProperties(config);

        expect(config.page?.targeting).toBeUndefined();
        expect(config.page?.config?.targeting).toEqual({
          test: 'value',
          test2: 'value2',
        });
      });

      it('should preserve existing page.config properties', () => {
        const config: SampleConfig = {
          page: {
            sra: true,
            config: {
              privacyTreatments: {
                treatments: ['disablePersonalization'],
              },
            },
          },
          slots: [],
        };

        migrateLegacyProperties(config);

        expect(config.page?.config?.singleRequest).toBeTrue();
        expect(config.page?.config?.privacyTreatments).toEqual({
          treatments: ['disablePersonalization'],
        });
      });

      it('should migrate all legacy page properties at once', () => {
        const config: SampleConfig = {
          page: {
            sra: true,
            adsense: {
              pageUrl: 'https://www.example.com',
            },
            targeting: [{key: 'a', value: '1'}],
          },
          slots: [],
        };

        migrateLegacyProperties(config);

        const pageConfig = config.page?.config;
        expect(config.page?.sra).toBeUndefined();
        expect(config.page?.adsense).toBeUndefined();
        expect(config.page?.targeting).toBeUndefined();

        expect(pageConfig?.singleRequest).toBe(true);
        expect(pageConfig?.adsenseAttributes?.page_url).toBe(
          'https://www.example.com',
        );
        expect(pageConfig?.targeting).toEqual({a: '1'});
      });
    });

    describe('slot properties', () => {
      it('should migrate targeting property', () => {
        const config: SampleConfig = {
          slots: [
            {
              adUnit: '',
              size: 'fluid',
              targeting: [
                {key: 'test', value: 'value'},
                {key: 'test2', value: 'value2'},
              ],
            },
          ],
        };

        migrateLegacyProperties(config);

        const slot = config.slots[0];
        expect(slot.targeting).toBeUndefined();
        expect(slot.config?.targeting).toEqual({
          test: 'value',
          test2: 'value2',
        });
      });

      it('should preserve existing slot.config properties', () => {
        const config: SampleConfig = {
          slots: [
            {
              adUnit: '',
              size: 'fluid',
              targeting: [{key: 'a', value: '1'}],
              config: {
                interstitial: {
                  requireStorageAccess: true,
                },
              },
            },
          ],
        };

        migrateLegacyProperties(config);

        const slot = config.slots[0];
        expect(slot.config?.targeting).toEqual({a: '1'});
        expect(slot.config?.interstitial).toEqual({requireStorageAccess: true});
      });

      it('should migrate properties for multiple slots', () => {
        const config: SampleConfig = {
          slots: [
            {
              adUnit: '',
              size: 'fluid',
              targeting: [{key: 'a', value: '1'}],
            },
            {
              adUnit: '',
              size: 'fluid',
              targeting: [{key: 'b', value: '2'}],
            },
          ],
        };

        migrateLegacyProperties(config);

        expect(config.slots[0].targeting).toBeUndefined();
        expect(config.slots[0].config?.targeting).toEqual({a: '1'});
        expect(config.slots[1].targeting).toBeUndefined();
        expect(config.slots[1].config?.targeting).toEqual({b: '2'});
      });
    });

    it('should migrate both page and slot properties', () => {
      const config: SampleConfig = {
        page: {
          sra: true,
          targeting: [{key: 'page-level', value: 'true'}],
        },
        slots: [
          {
            adUnit: '',
            size: 'fluid',
            targeting: [{key: 'slot-level', value: '1'}],
          },
        ],
      };

      migrateLegacyProperties(config);

      // Check page migration
      expect(config.page?.sra).toBeUndefined();
      expect(config.page?.targeting).toBeUndefined();
      expect(config.page?.config?.singleRequest).toBeTrue();
      expect(config.page?.config?.targeting).toEqual({'page-level': 'true'});

      // Check slot migration
      const slot = config.slots[0];
      expect(slot.targeting).toBeUndefined();
      expect(slot.config?.targeting).toEqual({'slot-level': '1'});
    });
  });
});
