/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export {};

declare global {
  interface Window {
    CANONICAL_PATH?: string;
    INITIAL_DATA?: {[key: string]: string};
    ShadyCSS?: {
      getComputedStyleValue(el: Element, name: string): string;
    };
    ShadyDOM?: {
      inUse?: boolean;
    };
    HTMLImports?: {whenReady: (cb: () => void) => void};
    linkify(
      text: string,
      options: {callback: (text: string, href?: string) => void}
    ): void;
    ASSETS_PATH?: string;
  }

  interface Performance {
    // typescript doesn't know about the memory property.
    // Define it here, so it can be used everywhere
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}
