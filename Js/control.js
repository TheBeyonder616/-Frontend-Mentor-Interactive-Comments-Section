import { script } from "./script.js";
import { index } from "./index.js";

export const userState = new Map();

const isElement = (el) => el instanceof Element;
const error = (el) => console.error(" Invalid, Element", el);

/**
 * ? Provides utility functions for managing CSS classes and attributes of DOM elements.
 */
export const cList = {
  add: (el, cl) => (isElement(el) ? el.classList.add(cl) : error(el)),
  rem: (el, cl) => (isElement(el) ? el.classList.remove(cl) : error()),
  tog: (el, cl) => (isElement(el) ? el.classList.toggle(cl) : error()),
  contains: (el, cl) => (isElement(el) ? el.classList.contains(cl) : error()),
  attribute: (el, at) => (isElement(el) ? el.getAttribute(at) : error()),
  setAttribute: (el, att, value) =>
    isElement(el) ? el.setAttribute(att, value) : error(),
  remAttribute: (el, att) => el.removeAttribute(att),
};

/**
 *? Contains utility functions for selecting and manipulating DOM elements.
 * Provides methods to query elements, retrieve attributes, and find ancestors.
 */
export const select = {
  el: (el, sl) => el.querySelector(sl),
  elAll: (el, sl) => el.querySelectorAll(sl),
  closest: (el, sl) => el.closest(sl),
  id: (sl) => document.getElementById(sl),
  attribute: (el, sl) => el.getAttribute(sl),
};

class Control {
  constructor() {
    this.time = 150;
    this.handleClick = this.debounce(this.handleClick, this.time);
    this.handleKey = this.debounce(this.handleKey, this.time);
    this.handleInput = this.debounce(this.handleInput, this.time);
  }

  //!=========================================================={Markup}
  /**
   *? Inserts user data into the markup.
   * @returns {Promise<void>}
   */
  async _insertUser() {
    const article = select.el(
      document,
      `[data-display="Interactive-comments"]`
    );
    const data = await script.renderData();
    index.handleCommentMarkup(article, data);
  }

  /**
   *? Handles the display of a user's previous response in the comment section.
   * @param {Object} data - The data object containing user and replies information.
   * @param {HTMLElement} comment - The comment element to update.
   */
  _userOldRespond(data, comment) {
    const [user] = data.user;
    const content = user.content;
    const [reply] = data.replies;
    const respond = `@${reply.userName}`;
    index.handleUserCardMarkup(comment, data, `${respond}${content}`, true);
  }

  /**
   * ? Handles the display of a previous reply in the comment section.
   * @param {Object} data - The data object containing comments and replies information.
   * @param {HTMLElement} comment - The comment element to update.
   */
  _replyOldRespond(data, comment) {
    const [, comment2] = data.comments;
    const respond = `@${comment2.userName}`;
    const [reply] = data.replies;
    const content = `${respond} ${reply.content}`;
    index.handleCardMarkup(comment, data, true, `${content}`);
  }

  /**
   *? Inserts sections into the markup.
   * @param {HTMLElement} parent - The parent element to insert sections into.
   */
  _insertSection(parent) {
    index.handleSectionMarkup(parent, true);
    index.handleSectionMarkup(parent);
  }

  /**
   *? Inserts comments into the markup.
   * @returns {Promise<void>}
   */
  async _insertComments() {
    const parent = select.el(document, `[data-display="comments"]`);
    const data = await script.renderData();
    this._insertSection(parent);

    const reply = select.el(document, `[data-display="comments-reply"]`);
    const comment = select.el(document, `[data-display="comments-comments"]`);

    index.handleCardMarkup(comment, data);
    this._replyOldRespond(data, reply);
    this._userOldRespond(data, reply);
  }

  /**
   * ? Initializes user states in the map based on the document structure.
   * @returns {Promise<void>}
   */
  async _initMap() {
    const parents = select.elAll(document, `[data-user-id]`);
    parents.forEach((parent) => script.initializeItemState(parent));
  }

  /**
   * ? Initializes the markup for the control, inserting users and comments.
   * @returns {Promise<void>}
   */
  async initMarkup() {
    await this._insertUser();
    await this._insertComments();
    await this._initMap();
  }

  // ?-------------------------------------------------------[User Comment]
  /**
   *  ? Inserts a new user comment into the comments section.
   * @returns {Promise<void>}
   */
  async _insertUserComment() {
    const comment = select.el(document, `[data-display="comments"]`);
    const reply = select.el(document, `[data-display="comments-reply"]`);
    const textarea = select.el(document, `[data-input="comment"]`);
    const approved = textarea.value.length > 15;
    const data = await script.renderData();

    if (!approved) return;
    const isReply = select.el(document, `[data-active-reply]`);

    isReply === null
      ? index.handleUserCardMarkup(comment, data, "")
      : index.handleUserCardMarkup(reply, data, "");
  }

  /**
   * ? Initializes the sending of a comment, either as a new comment or a reply.
   * @param {Event} e - The event triggered by the comment action.
   * @returns {Promise<void>}
   */
  async _initSendComment(e) {
    await this._insertUserComment(e);
    const isReply = select.el(document, `[data-active-reply]`);
    const comment = script.handleSendComment(e);
    const isTrue = isReply === null ? false : true;
    script.handleInsertComment(comment, isTrue);
  }

  /**
   * ? Handles either the editing or sending of a comment based on the current state.
   * @param {Event} e - The event triggered by the comment action.
   * @returns {Promise<void>}
   */
  async handleEditOrSendComment(e) {
    const activeEdit = select.el(document, `[data-insert-edit="true"]`);
    activeEdit ? script.handleNewCommentUpdate() : this._initSendComment(e);
  }
  //?------------------------------------------------------------------------[Observers]
  /**
   *? Initializes the mutation observers for handling dynamic changes in the DOM.
   * @returns {Promise<void>}
   */
  async initObservers() {
    script.handleMutation();
    script.handleObservePopUp();
  }
  // ?---------------------------------------------------------------------------[Debounce]
  /**
   * ? Debounces the given function to limit the rate at which it can fire.
   * @param {Function} func - The function to debounce.
   * @param {number} delay - The debounce delay in milliseconds.
   * @returns {Function} - A debounced version of the provided function.
   */
  debounce(func, delay) {
    let timeout;
    return (...args) => {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  //!====================================================={Events}
  /**
   * ? Handles click events for various actions defined in the markup.
   * @param {Event} e - The click event object.
   * @returns {Promise<void>}
   */
  async handleClick(e) {
    const action = select.closest(e.target, `[data-action]`);

    if (!action) return;

    const actionType = cList.attribute(action, "data-action");

    switch (actionType) {
      case "increment":
        script.isIncreased(e);
        break;
      case "decrement":
        script.isReduced(e);
        break;
      case "reply":
        script.handleReplyComment(e);
        break;
      case "delete":
        script.handleModelDisplay(true, e);
        break;
      case "edit":
        script.handleEditComment(e);
        break;
      case "cancel":
        script.handleModelDisplay(false, e);
        break;
      case "send":
        this.handleEditOrSendComment(e);
        break;
      case "confirm-delete":
        script.handleConfirmDelete();
        break;
      default:
        break;
    }
  }

  /**
   * ? Handles key events for various actions defined in the markup.
   * @param {Event} e - The key event object.
   * @returns {Promise<void>}
   */
  async handleKey(e) {
    const action = select.closest(e.target, `[data-action]`);
    const key = e.key;

    if (!action || !key) return;

    const actionType = cList.attribute(action, "data-action");
    const actionKey = key === "Enter";
    const keyAction = actionKey && actionType;

    switch (keyAction) {
      case "increment":
        script.isIncreased(e);
        break;
      case "decrement":
        script.isReduced(e);
        break;
      case "reply":
        script.handleReplyComment(e);
        break;
      case "delete":
        script.handleModelDisplay(true, e);
        break;
      case "edit":
        script.handleEditComment(e);
        break;
      case "cancel":
        script.handleModelDisplay(false, e);
        break;
      case "confirm-delete":
        script.handleConfirmDelete();
        break;
      default:
        break;
    }
  }

  /**
   *? Handles input events for comment text-areas, updating the content state.
   * @param {Event} e - The input event object.
   * @returns {Promise<void>}
   */
  async handleInput(e) {
    const textarea = select.closest(e.target, `[data-input="comment"]`);
    if (textarea) script.getTextContent(textarea);
  }
}

const control = new Control();

const initDom = async () => {
  const main = select.id("main");
  script.loadUserState();
  control.initObservers();
  control.initMarkup();
  main.addEventListener("click", control.handleClick.bind(control));
  main.addEventListener("keydown", control.handleKey.bind(control));
  main.addEventListener("input", control.handleInput.bind(control));
};

document.addEventListener("DOMContentLoaded", initDom);
