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
import '../../../scripts/bundled-polymer.js';

import '@polymer/paper-toggle-button/paper-toggle-button.js';
import '../../core/gr-reporting/gr-reporting.js';
import '../../shared/gr-button/gr-button.js';
import '../gr-message/gr-message.js';
import '../../../styles/shared-styles.js';
import {dom} from '@polymer/polymer/lib/legacy/polymer.dom.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import {GestureEventListeners} from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';
import {LegacyElementMixin} from '@polymer/polymer/lib/legacy/legacy-element-mixin.js';
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {htmlTemplate} from './gr-messages-list-experimental_html.js';
import {KeyboardShortcutBehavior} from '../../../behaviors/keyboard-shortcut-behavior/keyboard-shortcut-behavior.js';
import {util} from '../../../scripts/util.js';
import {MessageTags} from '../../../constants/constants.js';

/**
 * The content of the enum is also used in the UI for the button text.
 *
 * @enum {string}
 */
const ExpandAllState = {
  EXPAND_ALL: 'Expand All',
  COLLAPSE_ALL: 'Collapse All',
};

function isNewPatchSet(message) {
  if (!message || !message.tag) return false;
  return message.tag.includes(MessageTags.TAG_NEW_PATCHSET)
      || message.tag.includes(MessageTags.TAG_NEW_WIP_PATCHSET);
}

function hasHigherRevisionNumber(m, message) {
  return m._revision_number && m._revision_number > message._revision_number;
}

function isNewerReviewerUpdate(m, message) {
  if (!message || !message.tag || !m || !m.tag) return false;
  if (m.tag != MessageTags.TAG_REVIEWER_UPDATE) return false;
  return m.date > message.date;
}

function isImportant(message, allMessages) {
  // Human messages don't have a tag. They are always important.
  if (!message.tag) return true;

  // Autogenerated messages are only important, if there is not a newer message
  // with the same tag.
  const tag = message.tag;
  const sameTag = m =>
    m.tag === tag || (isNewPatchSet(m) && isNewPatchSet(message));
  return !allMessages.filter(sameTag).some(m =>
    hasHigherRevisionNumber(m, message) || isNewerReviewerUpdate(m, message));
}

export const TEST_ONLY = {
  isImportant,
};

/**
 * @extends Polymer.Element
 */
class GrMessagesListExperimental extends mixinBehaviors( [
  KeyboardShortcutBehavior,
], GestureEventListeners(
    LegacyElementMixin(
        PolymerElement))) {
  static get template() { return htmlTemplate; }

  static get is() { return 'gr-messages-list-experimental'; }

  static get properties() {
    return {
      /** @type {?} */
      change: Object,
      changeNum: Number,
      /**
       * These are just the change messages. They are combined with reviewer
       * updates below. So _combinedMessages is the more important property.
       */
      messages: {
        type: Array,
        value() { return []; },
      },
      /**
       * These are just the reviewer updates. They are combined with change
       * messages above. So _combinedMessages is the more important property.
       */
      reviewerUpdates: {
        type: Array,
        value() { return []; },
      },
      changeComments: Object,
      projectName: String,
      showReplyButtons: {
        type: Boolean,
        value: false,
      },
      labels: Object,

      /**
       * Keeps track of the state of the "Expand All" toggle button. Note that
       * you can individually expand/collapse some messages without affecting
       * the toggle button's state.
       *
       * @type {ExpandAllState}
       */
      _expandAllState: {
        type: String,
        value: ExpandAllState.EXPAND_ALL,
      },
      _expandAllTitle: {
        type: String,
        computed: '_computeExpandAllTitle(_expandAllState)',
      },

      _showAllActivity: {
        type: Boolean,
        value: false,
        observer: '_observeShowAllActivity',
      },
      /**
       * The merged array of change messages and reviewer updates.
       */
      _combinedMessages: {
        type: Array,
        computed: '_computeCombinedMessages(messages, reviewerUpdates)',
        observer: '_combinedMessagesChanged',
      },

      _labelExtremes: {
        type: Object,
        computed: '_computeLabelExtremes(labels.*)',
      },
    };
  }

  scrollToMessage(messageID) {
    const selector = `[data-message-id="${messageID}"]`;
    const el = this.shadowRoot.querySelector(selector);

    if (!el && this._showAllActivity) {
      console.warn(`Failed to scroll to message: ${messageID}`);
      return;
    }
    if (!el) {
      this._showAllActivity = true;
      setTimeout(() => this.scrollToMessage(messageID));
      return;
    }

    el.set('message.expanded', true);
    let top = el.offsetTop;
    for (let offsetParent = el.offsetParent;
      offsetParent;
      offsetParent = offsetParent.offsetParent) {
      top += offsetParent.offsetTop;
    }
    window.scrollTo(0, top);
    this._highlightEl(el);
  }

  _observeShowAllActivity(showAllActivity) {
    // We have to call render() such that the dom-repeat filter picks up the
    // change.
    this.$.messageRepeat.render();
  }

  /**
   * Filter for the dom-repeat of combinedMessages.
   */
  _isMessageVisible(message) {
    const allMessages = this._combinedMessages;
    return this._showAllActivity || isImportant(message, allMessages);
  }

  /**
   * Merges change messages and reviewer updates into one array.
   */
  _computeCombinedMessages(messages, reviewerUpdates) {
    messages = messages || [];
    reviewerUpdates = reviewerUpdates || [];
    let mi = 0;
    let ri = 0;
    let combinedMessages = [];
    let mDate;
    let rDate;
    for (let i = 0; i < messages.length; i++) {
      messages[i]._index = i;
    }

    while (mi < messages.length || ri < reviewerUpdates.length) {
      if (mi >= messages.length) {
        combinedMessages = combinedMessages.concat(reviewerUpdates.slice(ri));
        break;
      }
      if (ri >= reviewerUpdates.length) {
        combinedMessages = combinedMessages.concat(messages.slice(mi));
        break;
      }
      mDate = mDate || util.parseDate(messages[mi].date);
      rDate = rDate || util.parseDate(reviewerUpdates[ri].date);
      if (rDate < mDate) {
        combinedMessages.push(reviewerUpdates[ri++]);
        rDate = null;
      } else {
        combinedMessages.push(messages[mi++]);
        mDate = null;
      }
    }
    combinedMessages.forEach(m => {
      if (m.expanded === undefined) {
        m.expanded = false;
      }
    });
    return combinedMessages;
  }

  _updateExpandedStateOfAllMessages(exp) {
    if (this._combinedMessages) {
      for (let i = 0; i < this._combinedMessages.length; i++) {
        this._combinedMessages[i].expanded = exp;
        this.notifyPath(`_combinedMessages.${i}.expanded`);
      }
    }
  }

  _computeExpandAllTitle(_expandAllState) {
    if (_expandAllState === ExpandAllState.COLLAPSED_ALL) {
      return this.createTitle(
          this.Shortcut.COLLAPSE_ALL_MESSAGES, this.ShortcutSection.ACTIONS);
    }
    if (_expandAllState === ExpandAllState.EXPAND_ALL) {
      return this.createTitle(
          this.Shortcut.EXPAND_ALL_MESSAGES, this.ShortcutSection.ACTIONS);
    }
    return '';
  }

  _highlightEl(el) {
    const highlightedEls =
        dom(this.root).querySelectorAll('.highlighted');
    for (const highlighedEl of highlightedEls) {
      highlighedEl.classList.remove('highlighted');
    }
    function handleAnimationEnd() {
      el.removeEventListener('animationend', handleAnimationEnd);
      el.classList.remove('highlighted');
    }
    el.addEventListener('animationend', handleAnimationEnd);
    el.classList.add('highlighted');
  }

  /**
   * @param {boolean} expand
   */
  handleExpandCollapse(expand) {
    this._expandAllState = expand ? ExpandAllState.COLLAPSE_ALL
      : ExpandAllState.EXPAND_ALL;
    this._updateExpandedStateOfAllMessages(expand);
  }

  _handleExpandCollapseTap(e) {
    e.preventDefault();
    this.handleExpandCollapse(
        this._expandAllState === ExpandAllState.EXPAND_ALL);
  }

  _handleAnchorClick(e) {
    this.scrollToMessage(e.detail.id);
  }

  _isVisibleShowAllActivityToggle(messages) {
    messages = messages || [];
    return messages.some(m => !isImportant(m, messages));
  }

  /**
   * This method is for reporting stats only.
   */
  _combinedMessagesChanged(combinedMessages) {
    if (combinedMessages) {
      if (combinedMessages.length === 0) return;
      const tags = combinedMessages.map(
          message => message.tag || message.type ||
              (message.comments ? 'comments' : 'none'));
      const tagsCounted = tags.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {all: combinedMessages.length});
      this.$.reporting.reportInteraction('messages-count', tagsCounted);
    }
  }

  /**
   * Compute a mapping from label name to objects representing the minimum and
   * maximum possible values for that label.
   */
  _computeLabelExtremes(labelRecord) {
    const extremes = {};
    const labels = labelRecord.base;
    if (!labels) { return extremes; }
    for (const key of Object.keys(labels)) {
      if (!labels[key] || !labels[key].values) { continue; }
      const values = Object.keys(labels[key].values)
          .map(v => parseInt(v, 10));
      values.sort((a, b) => a - b);
      if (!values.length) { continue; }
      extremes[key] = {min: values[0], max: values[values.length - 1]};
    }
    return extremes;
  }

  /**
   * Computes message author's file comments for change's message. The backend
   * sets comment.change_message_id for matching, so this computation is fairly
   * straightforward.
   *
   * @param {!Object} changeComments changeComment object, which includes
   *     a method to get all published comments (including robot comments),
   *     which returns a Hash of arrays of comments, filename as key.
   * @param {!Object} message
   * @return {!Array} Array of comment threads.
   */
  _computeThreadsForMessage(changeComments, message) {
    if ([changeComments, message].some(arg => arg === undefined)) {
      return [];
    }

    if (message._index === undefined || !this.messages) {
      return [];
    }

    const commentThreads = changeComments.getAllThreadsForChange()
        .map(c => { return {...c}; });

    return commentThreads.filter(thread => thread.comments
        .map(comment => {
          // collapse all by default
          comment.collapsed = true;
          return comment;
        }).some(comment => {
          const condition = comment.change_message_id === message.id;
          // Since getAllThreadsForChange() always returns a new copy of
          // all comments we can modify them here without worrying about
          // polluting other threads.
          comment.collapsed = !condition;
          if (condition) {
            comment.extraNote = 'From this change log';
          }
          return condition;
        })
    );
  }
}

customElements.define(GrMessagesListExperimental.is,
    GrMessagesListExperimental);