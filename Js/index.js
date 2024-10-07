import { cList, select } from "./control.js";

class Index {
  constructor() {
    this.intervalId = null;
  }

  /**
   *? Converts a relative date string to a Date object.
   * @param {string} input - Relative date (e.g., "2 days ago").
   * @returns {Date|null} Corresponding Date or null if invalid.
   */
  _dateFromText(input) {
    if (!input || typeof input !== "string") return null;

    const currentDate = new Date();
    const match = input.match(
      /(\d+)\s*(day|days|week|weeks|month|months|year|years)\s*ago/i
    );

    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    const newDate = new Date(currentDate);
    switch (unit) {
      case "day":
      case "days":
        newDate.setDate(currentDate.getDate() - value);
        break;
      case "week":
      case "weeks":
        newDate.setDate(currentDate.getDate() - value * 7);
        break;
      case "month":
      case "months":
        newDate.setMonth(currentDate.getMonth() - value);
        break;
      case "year":
      case "years":
        newDate.setFullYear(currentDate.getFullYear() - value);
        break;
      default:
        return null;
    }

    return newDate;
  }

  /**
   *? Formats a relative date string into a localized date string.
   * @param {string} date - Relative date string.
   * @returns {string} Formatted date or "Invalid date".
   */
  dateFormNumber(date) {
    const format = this._dateFromText(date);
    return format ? format.toLocaleDateString() : "Invalid date";
  }
  //?-----------------------------------------------------------------{Updated date}

  /**
   *? Formats a timestamp into a "time ago" string.
   * @param {number} timestamp - Timestamp to format.
   * @returns {string} Time ago string.
   */
  formatTimeAgo(timestamp) {
    const {
      yearsAgo,
      monthsAgo,
      weeksAgo,
      daysAgo,
      hoursAgo,
      minutesAgo,
      secondsAgo,
    } = this.getTimeDifference(timestamp);

    switch (true) {
      case yearsAgo > 0:
        return yearsAgo === 1 ? "1 year ago" : `${yearsAgo} years ago`;
      case monthsAgo > 0:
        return monthsAgo === 1 ? "1 month ago" : `${monthsAgo} months ago`;
      case weeksAgo > 0:
        return weeksAgo === 1 ? "1 week ago" : `${weeksAgo} weeks ago`;
      case daysAgo > 0:
        return daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
      case hoursAgo > 0:
        return hoursAgo === 1 ? "1 hour ago" : `${hoursAgo} hours ago`;
      case minutesAgo > 0:
        return minutesAgo === 1 ? "1 minute ago" : `${minutesAgo} minutes ago`;
      default:
        return secondsAgo === 1 ? "1 second ago" : `${secondsAgo} seconds ago`;
    }
  }

  /**
   *? Calculates time difference between now and a given timestamp.
   * @param {number} timestamp - Timestamp to compare.
   * @returns {Object} Object with time differences.
   */
  getTimeDifference(timestamp) {
    const now = Date.now();
    const secondsAgo = Math.floor((now - timestamp) / 1000);
    const minutesAgo = Math.floor(secondsAgo / 60);
    const hoursAgo = Math.floor(secondsAgo / 3600);
    const daysAgo = Math.floor(secondsAgo / 86400);
    const weeksAgo = Math.floor(daysAgo / 7);
    const monthsAgo = Math.floor(daysAgo / 30); // Approximation
    const yearsAgo = Math.floor(daysAgo / 365); // Approximation

    return {
      secondsAgo,
      minutesAgo,
      hoursAgo,
      daysAgo,
      weeksAgo,
      monthsAgo,
      yearsAgo,
    };
  }

  /**
   *? Updates an element with the formatted time since a timestamp.
   * @param {HTMLElement} element - Element to update.
   * @param {number} initialTimeStamp - Timestamp to format.
   */
  updateCurrentTime(element, initialTimeStamp) {
    const formattedTime = this.formatTimeAgo(initialTimeStamp);
    element.textContent = formattedTime;
  }

  /**
   *? Starts periodic updates of time in an element.
   * @param {HTMLElement} element - Element to update.
   * @param {number} initialTimeStamp - Timestamp to format.
   * @param {number} [interval=60000] - Update interval in milliseconds.
   */
  startUpdatingCurrentTime(element, initialTimeStamp, interval = 60000) {
    this.updateCurrentTime(element, initialTimeStamp);

    this.intervalId = setInterval(
      () => this.updateCurrentTime(element, initialTimeStamp),
      interval
    );
  }

  /**
   *? Clears the time update interval.
   */
  clearUpdatingCurrentTime() {
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
  // !============================================================[Markup]
  /**
   *? Generates markup for a parent comment section.
   * @param {boolean} comment - Whether it's a comment or reply section.
   * @returns {string} HTML string for the section.
   */
  markupParent(comment) {
    return comment
      ? `<section class="comment--comment" data-display="comments-comments"></section>`
      : `  <section class="comment--replies" data-display="comments-reply"></section>`;
  }

  /**
   *? Generates markup for the user input area.
   * @param {Object} data - User data containing image and name.
   * @returns {string} HTML string for the user input section.
   */
  markupUser(data) {
    return `
 <section class="current-user" data-display="add-comments" data-user-id="4">
  <div class="current-user__wrapper">
  <div>
    <div class="img img--desktop">
      <picture>
        <source srcset="${data.currImgPng}" />
        <img src="${data.currImgWebp}" alt="An image of ${data.currName}" />
      </picture>
    </div>
    </div>
    <!-- ?[Text area] -->
    <label class="current-user__label" for="add-comments">
      <textarea
        class="current-user__textarea"
        name="add-comments"
        data-input="comment"
        placeholder="Add a comment..."
      ></textarea>
    </label>
    <!-- ?[user] -->
    <div class="current-user__details">
      <div class="img img--mobile">
        <picture>
          <source srcset="${data.currImgPng}" />
          <img src="${data.currImgWebp}" alt="An image of ${data.currName}" />
        </picture>
      </div>
      <button class="btn send--btn" data-action="send">send</button>
    </div>
  </div>
</section>
  `;
  }

  /**
   *? Generates markup for a user card, including time formatting.
   * @param {Object} data - User data.
   * @param {string} comment - Comment content.
   * @param {boolean} oldComment - Whether it's a reply.
   * @returns {string} HTML string for the user card.
   */
  markupUserCard(data, comment, oldComment) {
    const initialTimeStamp = Date.now();
    const timeString = this.formatTimeAgo(initialTimeStamp);
    const dateTime = new Date(initialTimeStamp).toISOString();
    const isComment = oldComment ? "" : "card--user-reply";
    return `
<!-- ?[Current-Card] -->
<!--?[Card] -->
<div class="card ${isComment} " data-user-id="${
      oldComment ? 5 : initialTimeStamp
    }">
  <!-- ?[Figure] -->
  <section class="card-details">
    <div class="card-header">
      <figure class="card__figure">
        <div class="img">
          <picture>
            <source srcset="${data.currImgPng}" />
            <img src="${data.currImgWebp}" alt="An image of ${data.currName}" />
          </picture>
        </div>
        <figcaption class="card__figure-caption">
          <h2 class="heading-primary">amyrobson</h2>
          <a class="btn" href="#main" data-action="you">you</a>
          <time class="heading-time" datetime="${dateTime}" data-display="time"
            >${timeString}</time
          >
        </figcaption>
      </figure>
      <!-- !===================================================[desktop] -->
      <div class="card__action-reply active--reply action--reply-desktop">
        <!--  ?[Delete]-->
        <section class="card__action-reply">
          <div
            class="svg reply--svg delete--svg"
            data-action="delete"
            tabindex="0"
          >
            <svg aria-label="Icon delete">
              <use href="./images/icon.svg#icon-delete"></use>
            </svg>
          </div>
          <span class="heading-secondary heading-delete">Delete</span>
        </section>
        <!-- ?[Edit] -->
        <section class="card__action-reply">
          <div class="svg reply--svg" data-action="edit" tabindex="0">
            <svg aria-label="Icon edit">
              <use href="./images/icon.svg#icon-edit"></use>
            </svg>
          </div>
          <span class="heading-secondary">Edit</span>
        </section>
      </div>
    </div>
    <!-- ?[Comment] -->
    <p
      class="heading-p"
      data-insert-comment
      data-insert-reply
      data-user-state-comment
    >
      ${comment}
    </p>
  </section>
  <!--?-------------------------------[Action] -->
  <section class="card__action">
    <!-- ?[Reply] -->
    <div class="card__action-likes">
      <div class="card-wrap">
        <!-- ?[Increment] -->
        <div class="svg likes--svg" data-action="increment" tabindex="0">
          <svg aria-label="Icon increment">
            <use href="./images/icon.svg#icon-plus"></use>
          </svg>
        </div>
      </div>
      <!-- ?[Quantity] -->
      <div class="card-wrap">
        <h3 class="heading-secondary" data-display="quantity">0</h3>
      </div>

      <div class="card-wrap">
        <!-- ?[Decrement] -->
        <div class="svg likes--svg" data-action="decrement" tabindex="0">
          <svg aria-label="Icon decrement">
            <use href="./images/icon.svg#icon-minus"></use>
          </svg>
        </div>
      </div>
    </div>
    <!-- ?[Likes] -->
    <!--!===========================================[Mobile]  -->
    <div class="card__action-reply active--reply action--reply-mobile">
      <!--  ?[Delete]-->
      <section class="card__action-reply">
        <div
          class="svg reply--svg delete--svg"
          data-action="delete"
          tabindex="0"
        >
          <svg aria-label="Icon delete">
            <use href="./images/icon.svg#icon-delete"></use>
          </svg>
        </div>
        <span class="heading-secondary heading-delete">Delete</span>
      </section>
      <!-- ?[Edit] -->
      <section class="card__action-reply">
        <div class="svg reply--svg" data-action="edit" tabindex="0">
          <svg aria-label="Icon edit">
            <use href="./images/icon.svg#icon-edit"></use>
          </svg>
        </div>
        <span class="heading-secondary">Edit</span>
      </section>
    </div>
  </section>
</div>

`;
  }

  /**
   *? Generates markup for a card with comments or replies.
   * @param {Object} data - Comment data.
   * @param {boolean} replies - Whether it's for replies.
   * @param {string} insertReply - Content to insert for replies.
   * @returns {string[]} Array of HTML strings for comments.
   */
  markupCard(data, replies, insertReply) {
    const comments = replies ? data.replies : data.comments;
    return comments.map((comment) => {
      const content = replies ? insertReply : comment?.content;
      return `
<!--?[Card] -->
<div class="card" data-user-id="${comment.id}">
<section class="card-details">
    <!-- ?[Figure] -->
    <div class="card-header">
        <figure class="card__figure">
            <div class="img">
                <picture>
                    <source srcset="${comment?.userImgPng}" />
                    <img
                    src="${comment?.userImgWebp}"
                    alt="An image of ${comment?.userName}"
                    />
                </picture>
            </div>
            <figcaption class="card__figure-caption">
                <h1 class="heading-primary" data-user-name>${
                  comment?.userName
                }</h1>
                <time
                class="heading-time"
                datetime="${this.dateFormNumber(comment.createdAt)}"
                    >${comment?.createdAt}</time
                    >
                </figcaption>
            </figure>
            <!--!=================================================[Desktop]  -->
            
            <div class="card__action-reply action--reply-desktop">
                <!--  ?[Reply]-->
                <div class="svg reply--svg" data-action="reply" tabindex="0">
                    <svg aria-label="Icon reply">
                        <use href="./images/icon.svg#icon-arrow"></use>
                    </svg>
                </div>
                <span class="heading-secondary">Reply</span>
            </div>
        </div>
        <!-- ?[Comment] -->
        <p class="heading-p" data-reply-comments data-user-state-comment ${
          replies ? "data-insert-reply" : ""
        }>${content}</p>
    </section>


  <!--?-------------------------------[Action] -->
  <section class="card__action">
    <!-- ?[Reply] -->
    <div class="card__action-likes">
    <div class="card-wrap">
      <!-- ?[Increment] -->
      <div class="svg likes--svg" data-action="increment">
        <svg aria-label="Icon increment">
          <use href="./images/icon.svg#icon-plus"></use>
        </svg>
      </div>
    </div>

      <div class="card-wrap">
      <!-- ?[Quantity] -->
      <span class="heading-secondary" data-display="quantity">12</span>
      </div>
    <div class="card-wrap">
      <!-- ?[Decrement] -->
      <div class="svg likes--svg" data-action="decrement">
        <svg aria-label="Icon decrement">
          <use href="./images/icon.svg#icon-minus"></use>
        </svg>
      </div>
    </div>

    </div>
    <!-- ?[Likes] -->
    <!--!============================================{mobile}  -->
    <div class="card__action-reply action--reply-mobile">
      <!--  ?[Reply]-->
      <div class="svg reply--svg" data-action="reply" tabindex="0">
        <svg aria-label="Icon reply">
          <use href="./images/icon.svg#icon-arrow"></use>
        </svg>
      </div>
      <span class="heading-secondary">Reply</span>
    </div>
  </section>
</div>

        `;
    });
  }

  /**
   *? Inserts markup for a section.
   * @param {HTMLElement} el - Element to insert into.
   * @param {boolean} comment - Whether to insert a comment section.
   */
  handleSectionMarkup(el, comment) {
    return el.insertAdjacentHTML("beforeend", this.markupParent(comment));
  }

  /**
   * ? Inserts markup for the user input area.
   * @param {HTMLElement} el - Element to insert into.
   * @param {Object} data - User data.
   */
  handleCommentMarkup(el, data) {
    return el.insertAdjacentHTML("beforeend", this.markupUser(data));
  }

  /**
   *? Inserts markup for cards.
   * @param {HTMLElement} el - Element to insert into.
   * @param {Object} data - Comment data.
   * @param {boolean} replies - Whether it's for replies.
   * @param {string} comment - Comment content.
   */
  handleCardMarkup(el, data, replies = false, comment) {
    const cardsMarkup = this.markupCard(data, replies, comment);
    return el.insertAdjacentHTML("beforeend", cardsMarkup.join(""));
  }

  /**
   *? Inserts markup for a user card and starts time updates.
   * @param {HTMLElement} el - Element to insert into.
   * @param {Object} data - User data.
   * @param {string} comment - Comment content.
   * @param {boolean} oC - Whether it's an old comment.
   */
  handleUserCardMarkup(el, data, comment, oC) {
    el.insertAdjacentHTML("beforeend", this.markupUserCard(data, comment, oC));
    const timeElement = select.el(el, `[data-display="time"]`);
    const initialTimeStamp = Date.now();
    this.startUpdatingCurrentTime(timeElement, initialTimeStamp);
  }
}

export const index = new Index();
