// Copyright 2008 Google Inc.
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

package com.google.gerrit.client.changes;

import com.google.gerrit.client.data.ChangeListService;
import com.google.gwt.core.client.GWT;
import com.google.gwt.user.client.rpc.ServiceDefTarget;

public class Util {
  public static final ChangeConstants C = GWT.create(ChangeConstants.class);

  public static final ChangeListService LIST_SVC;

  static {
    LIST_SVC = GWT.create(ChangeListService.class);
    ((ServiceDefTarget) LIST_SVC).setServiceEntryPoint(GWT.getModuleBaseURL()
        + "rpc/ChangeListService");
  }
}
