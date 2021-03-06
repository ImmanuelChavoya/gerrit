// Copyright (C) 2020 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
package com.google.gerrit.acceptance.testsuite.change;

/** An aggregation of methods on a specific patchset. */
public interface PerPatchsetOperations {

  /**
   * Retrieves the patchset.
   *
   * <p><strong>Note:</strong> This call will fail with an exception if the requested patchset
   * doesn't exist.
   *
   * @return the corresponding {@code TestPatchset}
   */
  TestPatchset get();

  /**
   * Starts the fluent chain to create a new comment. The returned builder can be used to specify
   * the attributes of the new comment. To create the comment for real, {@link
   * TestCommentCreation.Builder#create()} must be called.
   *
   * <p>Example:
   *
   * <pre>
   * String createdCommentUuid = changeOperations
   *     .change(changeId)
   *     .currentPatchset()
   *     .onLine(2)
   *     .ofFile("file1")
   *     .create();
   * </pre>
   *
   * @return builder to create a new comment
   */
  TestCommentCreation.Builder newComment();
}
