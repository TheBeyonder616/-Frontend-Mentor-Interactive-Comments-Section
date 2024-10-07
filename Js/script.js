import { cList, select, userState } from "./control.js";

class Script {
  constructor() {
    this.time = 500;
    this.approved = false;
  }

  //?----------------------------------------------------[Module]
  /**
   *? Retrieves the time attribute from a parent element.
   * @param {HTMLElement} parent - The parent element.
   * @return {string|undefined} The time value or undefined if not found.
   */
  _getTime(parent) {
    const timeElement = select.el(parent, `[data-display="time"]`);
    if (!timeElement) return undefined;
    const time = cList.attribute(timeElement, "datetime");
    return time;
  }

  /**
   *? Initializes user state for comments.
   * @param {HTMLElement} parent - The parent element for the user.
   */
  async initializeItemState(parent) {
    const userId = cList.attribute(parent, "data-user-id");
    const textarea = userId === "4";
    const time = this._getTime(parent) ?? 0;
    if (textarea) return;
    userState.set(userId, {
      count: 0,
      comment: "",
      isZero: false,
      time: time,
    });
    await this.updateUi(userId);
    this.saveUserState();
  }

  /**
   *? Increments the like count for a user.
   * @param {string} userId - The ID of the user.
   */
  async _increment(userId) {
    if (!userState.has(userId)) return;
    const state = userState.get(userId);
    state.count++;
    await this.updateUi(userId);
    this.saveUserState();
  }

  /**
   * ? Decrements the like count for a user.
   * @param {string} userId - The ID of the user.
   */
  async _decrement(userId) {
    if (!userState.has(userId)) return;
    const state = userState.get(userId);

    if (state.count > 0) state.count--;
    state.isZero = state.count === 0;

    await this.updateUi(userId);
    this.saveUserState();
  }

  /**
   *? Updates the UI based on the current user state.
   * @param {string} userId - The ID of the user.
   */
  async updateUi(userId) {
    if (!userState.has(userId)) return;
    const state = userState.get(userId);
    const parent = select.el(document, `[data-user-id="${userId}"]`);
    const notParent = !parent || parent === null;

    if (notParent) return;
    const comment = select.el(parent, `[data-user-state-comment]`);
    const quantity = select.el(parent, `[data-display="quantity"]`);
    const decrement = select.el(parent, `[data-action="decrement"]`);

    const oldCount = parseInt(quantity.textContent, 10);
    quantity.textContent = state.count;
    state.comment = comment.textContent;

    const saveLs = state.count !== oldCount;
    if (saveLs) this.saveUserState();

    const isZero = state.count === 0;
    isZero
      ? cList.add(decrement, "likes--svg-not-allowed")
      : cList.rem(decrement, "likes--svg-not-allowed");
  }

  //?-----------------------------------------------------[handle event]
  /**
   * ? Handles the increment action on like button click.
   * @param {Event} e - The click event.
   */
  isIncreased(e) {
    const userIdElement = select.closest(e.target, `[data-user-id]`);
    const userId = cList.attribute(userIdElement, "data-user-id");
    this._increment(userId);
  }

  /**
   *? Handles the decrement action on dislike button click.
   * @param {Event} e - The click event.
   */
  isReduced(e) {
    const userIdElement = select.closest(e.target, `[data-user-id]`);
    const userId = cList.attribute(userIdElement, "data-user-id");
    this._decrement(userId);
  }

  /**
   *? Inserts a comment for a user.
   * @param {string} value - The comment content.
   * @param {boolean} reply - Indicates if it's a reply.
   */
  handleInsertComment(value, reply) {
    let comment;
    comment = reply
      ? select.el(document, `[data-display="comments-reply"]`)
      : select.el(document, `[data-display="comments"]`);

    const checkValid = [comment, this._isValidComment(value)].every(
      (invalid) => !invalid
    );

    if (checkValid) return;
    const newComment = comment.lastElementChild;
    if (reply) cList.add(newComment, "is--reply");

    const commentElement = select.el(newComment, `[data-insert-comment]`);
    const check = [newComment, comment];
    
    if (check.some((item) => !item)) return;
    const userId = cList.attribute(newComment, "data-user-id");
    if (!userState.has(userId)) userState.set(userId, { comments: "" });

    const state = userState.get(userId);
    state.comments = value;
    commentElement.textContent = value;
    this.initializeItemState(newComment);
    this._removeDuplicateReply();
  }

  /**
   * ? Handles the sending of a comment from the textarea.
   * @param {Event} e - The event triggered by the comment submission.
   * @return {string|undefined} The comment text if valid, otherwise undefined.
   */
  handleSendComment(e) {
    const parent = e.target.parentNode;
    const gradParent = parent.parentNode;
    const textarea = select.el(gradParent, `[data-input="comment"]`);
    if (!textarea) return;

    const commentText = textarea.value.trim();
    if (!this._isValidComment(commentText)) {
      this._alertWarning();
      return;
    }

    const valueReturn = textarea.value;
    textarea.value = "";
    this.approved = false;
    return valueReturn;
  }

  //!===================================={Event}
  //?----------------------------------------------------[Modular display]
  /**
   *? Returns the modal element for display actions.
   * @return {HTMLElement} The modal element.
   */
  get _model() {
    return select.el(document, `[data-display="modula"]`);
  }

  /**
   * ? Shows the modal for user actions based on the event.
   * @param {Event} e - The event that triggered the modal display.
   */
  _showModel(e) {
    const parent = select.closest(e.target, `[data-user-id]`);
    const model = this._model;
    cList.rem(model, "hide");
    setTimeout(() => cList.add(model, "show"), this.time);
    cList.setAttribute(parent, "data-item-delete", "true");
  }

  /**
   * ? Hides the modal for user actions.
   */
  _hideModel() {
    const parent = select.el(document, `[data-item-delete="true"]`);
    const model = this._model;
    cList.rem(model, "show");
    setTimeout(() => cList.add(model, "hide"), this.time);
    cList.remAttribute(parent, `data-item-delete`);
  }

  /**
   *? Displays the modal for user actions.
   * @param {boolean} show - Indicates whether to show or hide the modal.
   * @param {Event} e - The event that triggered the modal action.
   */
  handleModelDisplay(show, e) {
    show ? this._showModel(e) : this._hideModel();
  }

  //?--------------------------------------------------------[Comments]
  /**
   * ? Gets the parent element for comments.
   * @return {HTMLElement} The comment parent element.
   */
  get _commentParent() {
    return select.el(document, `[data-display="add-comments"]`);
  }
  /**
   * ?Validates the comment length.
   * @param {string} comment - The comment text to validate.
   * @return {boolean} True if valid, false otherwise.
   */
  _isValidComment(comment) {
    if (!comment) return;
    const isValid = comment.length >= 15;
    this.approved = isValid;
    return isValid;
  }

  /**
   * ? Validates the comment input and updates the UI.
   * @param {Event} e - The event triggered by the input change.
   */
  _validateComment(e) {
    const parent = this._commentParent;

    !this._isValidComment(e.value)
      ? cList.add(parent, "invalid--comment")
      : cList.rem(parent, "invalid--comment");
  }

  /**
   * ? Toggles the cursor state based on approval.
   * @param {boolean} show - Indicates whether to show or hide the cursor.
   */
  _toggleCursor(show) {
    show
      ? cList.add(this._commentParent, "active--comment")
      : cList.rem(this._commentParent, "active--comment");
  }

  /**
   * ? Validates the comment based on length and updates UI accordingly.
   * @param {HTMLElement} el - The textarea element to validate.
   */
  getTextContent(el) {
    this._validateComment(el);
    const approved = this._isValidComment(el.value);
    this._toggleCursor(approved);

    if (!approved) return;
    this.comment = el.value;

    const userId = cList.attribute(
      select.closest(el, `[data-user-id]`),
      "data-user-id"
    );

    if (userId && userState.has(userId))
      userState.get(userId).comment = this.comment;
    this.approved = false;
  }
  // ?------------------------------------[Delete & Edit User comment]
  /**
   * ? Alerts the user if the comment is invalid.
   */
  _alertWarning() {
    return alert("Comment must not be less than 15 characters");
  }

  /**
   * ? Locates the comment textarea and focuses on it.
   */
  _locateTextarea() {
    const textarea = select.el(document, `[data-input='comment']`);
    if (!textarea) return;
    textarea.scrollIntoView({ behavior: "smooth" });
    textarea.focus();
  }

  /**
   * ?Confirms the deletion of a user comment.
   */
  handleConfirmDelete() {
    const parent = select.el(document, `[data-item-delete="true"]`);
    const userId = cList.attribute(parent, "data-user-id");

    if (!parent) return;
    if (!userState.has(userId)) return;
    const state = userState.get(userId);
    state.count = 0;

    this.saveUserState();
    this._hideModel();
    parent.remove();
  }

  /**
   *? Initiates the editing of a user comment.
   * @param {Event} e - The event triggered by the edit action.
   */
  handleEditComment(e) {
    this._removeDuplicateReply();
    this._clearTextArea();
    this._removeDuplicateEdit();
    this._locateTextarea();
    const parent = select.closest(e.target, `[data-user-id]`);
    const comment = select.el(parent, `[data-insert-comment]`);
    cList.setAttribute(comment, "data-insert-edit", "true");
  }

  /**
   * ? Removes the attribute for any active edit state.
   */
  _removeDuplicateEdit() {
    const activeEdit = select.el(document, `[data-insert-edit="true"]`);
    if (activeEdit) cList.remAttribute(activeEdit, "data-insert-edit");
  }

  /**
   *? Updates the active comment with new content after editing.
   */
  handleNewCommentUpdate() {
    const activeEdit = select.el(document, `[data-insert-edit="true"]`);
    const textarea = select.el(document, `[data-input='comment']`);
    const comment = textarea.value;
    if (!activeEdit) return;

    if (!this._isValidComment(comment)) {
      this._alertWarning();
      return;
    }

    const newComment = textarea.value;
    activeEdit.textContent = newComment;
    textarea.value = "";

    cList.remAttribute(activeEdit, "data-insert-edit");
  }

  //? --------------------------------------------------------[Reply]
  /**
   * ? Removes duplicate replies to ensure only one reply is active.
   */
  _removeDuplicateReply() {
    const prevReply = select.el(document, `[data-active-reply]`);
    if (prevReply) cList.remAttribute(prevReply, "data-active-reply");
  }

  /**
   * ? Clears the comment textarea.
   */
  _clearTextArea() {
    const textarea = select.el(document, `[data-input='comment']`);
    textarea.value = "";
  }

  /**
   * ? Gets the formatted reply text for the active reply user.
   * @return {string} The formatted reply text.
   */
  _getReply() {
    const replyElement = select.el(document, `[data-active-reply]`);
    const userName = cList.attribute(replyElement, "data-active-reply");
    return `@${userName}`;
  }

  /**
   * ? Adds the reply text to the comment textarea.
   * @param {string} reply - The reply text to add.
   */
  _addReplyToTextArea(reply) {
    const textarea = select.el(document, `[data-input="comment"]`);
    return (textarea.value = `${reply}`);
  }

  /**
   * ? Places a formatted reply into a specified paragraph.
   * @param {HTMLElement} paragraph - The paragraph element to update.
   */
  _placeReplyInSpan(paragraph) {
    const words = paragraph.innerText.trim().split(" ");
    if (words.length === 0) return;
    if (!words[0].startsWith("@")) return;
    words[0] = `<span class="heading-secondary">${words[0]}</span>`;
    paragraph.innerHTML = words.join(" ");
  }

  /**
   * ? Handles the reply action to a comment.
   * @param {Event} e - The event triggered by the reply action.
   */
  handleReplyComment(e) {
    this._removeDuplicateEdit();
    this._clearTextArea();
    this._removeDuplicateReply();
    const parent = select.closest(e.target, `[data-user-id]`);
    const user = select.el(parent, `[data-user-name]`);
    const name = user.textContent.trim();
    cList.setAttribute(user, "data-active-reply", `${name}`);
    this._locateTextarea();
    this.replyText = this._getReply();
    this._addReplyToTextArea(this._getReply());
  }
  //!=======================================================================[Observer Mutation &  Intersection]
  /**
   * ? Processes elements at set intervals to place replies in spans.
   * @param {HTMLElement[]} elements - The elements to process.
   * @param {number} interval - The interval ID to clear.
   * @param {function} resolve - The function to resolve the promise.
   */
  _interval(elements, interval, resolve) {
    elements.forEach((element) => {
      const text = element.innerText.trim();
      if (!text) return;
      if (element.dataset.processed) {
        clearInterval(interval);
        resolve();
        return;
      }
      this._placeReplyInSpan(element);
      element.dataset.processed = "true";
      clearInterval(interval);
      resolve();
    });
  }

  /**
   * ? Checks for elements that require replies and resolves when done.
   * @return {Promise<void>} Resolves when processing is complete.
   */
  _checkForReplyElement() {
    let time = 100;
    return new Promise((resolve) => {
      const element = select.elAll(document, `[data-insert-reply]`);
      if (!element) {
        resolve();
        return;
      }

      const interval = setInterval(
        () => this._interval(element, interval, resolve),
        time
      );
    });
  }

  /**
   * ? Processes each node to check for reply elements.
   * @param {Node} node - The node to inspect for reply elements.
   */
  async _nodeListElement(node) {
    const elements = select.elAll(node, `[data-insert-reply]`);
    elements.forEach(async (element) => {
      await this._checkForReplyElement(element);
    });
  }

  /**
   * ? Observes mutations in the DOM to check for added nodes.
   * @param {MutationRecord[]} mutationList - The list of mutations.
   */
  _observerMutation(mutationList) {
    mutationList.forEach((mutation) => {
      if (mutation.type === "childList")
        mutation.addedNodes.forEach(async (node) => {
          if (node.nodeType === Node.ELEMENT_NODE) this._nodeListElement(node);
        });
    });
  }

  /**
   * ? Starts observing the document for mutations.
   */
  handleMutation() {
    this.observer = new MutationObserver((mutationList) =>
      this._observerMutation(mutationList)
    );
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  //? ---------------------------------------------------------------------------------------[Observer Intersection]
  /**
   * ? Handles visibility of a popup based on intersection entries.
   * @param {IntersectionObserverEntry[]} entries - The intersection entries.
   */
  _handlePopUp(entries) {
    const [entry] = entries;
    const popup = select.el(document, "[data-popup]");
    !entry.isIntersecting
      ? cList.add(popup, "is--active")
      : cList.rem(popup, "is--active");
  }

  /**
   * ? Creates options for the Intersection Observer.
   * @param {number} threshold - The threshold for the observer.
   * @return {IntersectionObserverInit} The options for the observer.
   */
  _options(threshold) {
    return {
      root: null,
      threshold: threshold,
    };
  }

  /**
   * ? Starts observing a header for popup visibility.
   */
  handleObservePopUp() {
    const observer = new IntersectionObserver(
      this._handlePopUp.bind(this),
      this._options(0.7)
    );

    const header = select.id("header");
    observer.observe(header);
  }
  //!==============================================================================={Local Storage}

  /**
   *  ? Checks for the existence of user elements in the DOM.
   * @param {function} resolve - The function to call when elements exist.
   * @param {number} time - The time interval to retry checking.
   */
  async _checkElementExist(resolve, time) {
    const element = select.elAll(document, `[data-user-id]`);
    const exist = element.length > 4;
    exist
      ? resolve()
      : setTimeout(() => this._checkElementExist(resolve, time), time);
  }

  /**
   * ? Parses and updates the user state based on provided data.
   * @param {object} paredState - The state data to parse.
   * @return {Promise<void>} Resolves when the state is updated.
   */
  async _parseState(paredState) {
    let time = 100;
    await new Promise((resolve) => this._checkElementExist(resolve, time));

    const updatePromise = Object.entries(paredState).map(
      async ([userId, state]) => {
        userState.set(userId, state);
        return this.updateUi(userId);
      }
    );
    await Promise.all(updatePromise);
  }

  /**
   * ? Loads user state from local storage and updates the UI.
   * @return {Promise<void>} Resolves when the user state is loaded.
   */
  async loadUserState() {
    const storeState = localStorage.getItem("userState");
    if (!storeState) return;

    try {
      const paredState = JSON.parse(storeState);
      await this._parseState(paredState);
    } catch (error) {
      console.error("Failed to load user state: '", error);
    }
  }

  /**
   * ? Saves the current user state to local storage.
   * @return {Promise<void>} Resolves when the user state is saved.
   */
  async saveUserState() {
    try {
      const stateToSave = {};
      userState.forEach((value, key) => (stateToSave[key] = value));
      localStorage.setItem("userState", JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Error saving user state to local Storage", error);
    }
  }

  //!========================================================{fetchData}
  /**
   *? Fetches data from a JSON file.
   * @return {Promise<object>} The fetched data.
   */
  async _fetchData() {
    try {
      const res = await fetch("data.json");
      if (!res.ok) throw new Error(`HTTP error!  status: ${res.status}`);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(error, "FetchData");
    }
  }

  /**
   * ? Processes fetched data to extract relevant details.
   * @param {object} data - The fetched data.
   * @return {Promise<object>} The processed comment and user data.
   */
  async getData(data) {
    const { comments, currentUser } = await data;
    const commentsData = comments.map(
      ({ content, createdAt, id, replies, score, user }) => {
        return {
          id,
          content,
          createdAt,
          replies,
          score,
          userName: user.username,
          userImgPng: user.image.png,
          userImgWebp: user.image.webp,
        };
      }
    );

    const repliesData = comments[1].replies.map(
      ({ content, createdAt, id, replies, score, user }) => {
        return {
          id,
          content,
          createdAt,
          replies,
          score,
          userName: user.username,
          userImgPng: user.image.png,
          userImgWebp: user.image.webp,
        };
      }
    );

    const [data1, data2] = repliesData;

    return {
      currName: currentUser.username,
      currImgPng: currentUser.image.png,
      currImgWebp: currentUser.image.webp,
      comments: commentsData,
      replies: [data1],
      user: [data2],
    };
  }

  /**
   * ? Renders data by fetching and processing it.
   * @return {Promise<object>} The rendered data.
   */
  async renderData() {
    const rawData = await this._fetchData();
    return this.getData(rawData);
  }
}

export const script = new Script();
