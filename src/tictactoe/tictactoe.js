import {HandlerMissuseError} from './errors.js';
import Player from './player.js';


/**
 * A simple Tic Tac Toe game as a custom element.
 */
class TicTacToe extends HTMLElement {
  /** 
   * The current game's internal score tracker.
   * @type {Score} */
  #score = [0, 0, 0, 0, 0, 0, 0, 0];

  /**
   * The current game's internal turn tracker.
   * @type {number}
   */
  #turn = 0;

  /**
   * The winner of the game.
   * @type {Winner}
   */
  #winner = undefined;

  /**
   * If playing the computer, this is a Player object.
   * @type {Player}
   */
  #opponent;

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.append(template());
  }

  /**
   * Resets the game to the initial state.
   * @param {bool} computer true indicates to play against the computer.
   * @param {bool} firstPlayer true indicates the computer is the first player.
   * @param {number} skillLevel 0, 1, 2 skill of the computer.
   */
  reset(computer, firstPlayer, skillLevel) {
    this.#turn = 0;
    this.#winner = undefined;
    //             r1 r2 r3 c1 c2 c3 d1 d2
    this.#score = [0, 0, 0, 0, 0, 0, 0, 0];
    let allGroups = this.shadowRoot.querySelectorAll('g')
    for (let i = 0; i < allGroups.length; i++) {
      allGroups[i].classList.remove('x');
      allGroups[i].classList.remove('o');
      allGroups[i].classList.remove('none');
    }

    if (computer) {
      let p = firstPlayer === true ? 0 : 1;
      this.#opponent = new Player(this, p, skillLevel);
      if (p === 0) {
        this.#opponent.move();
      }
    } else {
      this.#opponent = undefined;
    }
  }

  /**
   * The current turn of the game.
   */
  get turn() {
    return this.#turn;
  }

  /**
   * The current score array. This represents the state of the board.
   * @returns {Score} Array of values for: row1 row2 row3 col1 col2 col3 backslash forwardslash
   */
  get score() {
    return [...this.#score];
  }

  /**
   * Perform a turn if possible.
   * @param {number} player 0 or 1 representing which player is moving.
   * @param {HTMLElement} grid the element of the grid square to mark.
   */
  doTurn(player, grid) {
    if (this.#winner === undefined && player === this.turn % 2) {
      let validMove = grid.classList.length === 0;
      if (validMove) {
        if (player === 0) {
          grid.classList.add('x');
        } else {
          grid.classList.add('o');
        }
        this.#turn++;
        this.#updateScore(player, grid.id);
        this.#checkWin();
      }
    }
  }

  /**
   * Returns an array of all the squares in the game.
   * @returns {Array<HTMLElement>} An array of the squares in the game.
   */
  getSquares() {
    return [...this.shadowRoot.querySelectorAll('#squares g')];
  }

  /**
   * Returns an array of all the empty squares in the game.
   * @returns {Array<HTMLElement>} An array of the empty squares in the game.
   */
  getEmptySquares() {
    return this.getSquares().filter(s => {
      return s.classList.length === 0;
    });
  }

  connectedCallback() {
    let gameboard = this.shadowRoot.querySelector('#gameboard');
    boardsvg.then(svg => {
      gameboard.innerHTML = svg;
      this.reset(true, false, 2);
    });
    console.log('connected');
    if (this.isConnected) {
      console.log('adding listen')
      this.addEventListener('click', this.#clickHandler);
    }
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#clickHandler);
  }

  /**
   * Handles the click event when there are human players.
   * @param {MouseEvent} e the click event.
   */
  #clickHandler(e) {
    if (this instanceof TicTacToe) {
      // TODO: Human is always player 0, Fix so human can be second player.
      let player = this.turn % 2;
      let elm = this.shadowRoot.elementFromPoint(e.clientX, e.clientY);
      let gridsquare = elm.parentNode;
      this.doTurn(player, gridsquare);

      if (this.#winner === undefined && this.#opponent) {
        // TODO: Handle all player game types for human/human, human/comp, comp/human, and comp/comp
        this.#opponent.move();
      }

      if (elm.parentNode.id === 'replay') {
        this.reset(true, false, 2);
      }
    } else {
      throw new HandlerMissuseError();
    }
  }

  /**
   * Updates the score array based on the player and the grid square.
   * @param {number} player 0 or 1 representing the players.
   * @param {string} gridId the ID of the grid square.
   */
  #updateScore(player, gridId) {
    let s = player === 0 ? 1 : -1;
    let g1 = parseInt(gridId[1], 10);
    let g2 = parseInt(gridId[2], 10);
    // Generalized score calculator for N x N grid where gridId.match(/g[0-2][0-2]/)
    // This avoids a 52 line fully expanded switch statement.
    // Though arguably, the condensed un-lintable switch is the most understandable.
    this.#score[g2] += s; // Rows
    this.#score[g1 + 3] += s; // Columns
    if (g1 === g2) { // D1: // g00, g11, g22
      this.#score[6] += s; // Index is N + N.
    }
    if (g1 + g2 === 2) { // D2:  g20, g11, g02 - matching squares are: g1 + g2 = n - 1
      this.#score[7] += s; // Index is N + N + 1
    }
  }

  /**
   * Checks if the game is completed and triggers the end of game screens.
   */
  #checkWin() {
    if (this.#winner !== undefined) { return; }
    let w = this.shadowRoot.querySelector('#win');
    for (let i = 0; i < this.#score.length; i++) {
      let s = this.#score[i];
      if (s === 3) {
        this.#winner = 0;
        w.classList.add('x');
        return;
      } else if (s === -3) {
        this.#winner = 1;
        w.classList.add('o');
        return;
      }
    }
    if (this.turn >= 9) {
      this.#winner = -1;
      w.classList.add('none');
      return;
    }
  }
}


/**
 * A promise that resolves to the game board's SVG text.
 * @private
 * @type {Promise}
 * @returns {string} The HTML String.
 */
const boardsvg = (function(src) {
  return new Promise((resolve, reject) => {
    fetch(src)
      .then(r => r.text())
      .then(t => resolve(t))
      .catch(e => reject(e));
  });
})('./gameboard.svg');


/**
 * The game's HTML Structure and style. Each invocation will return a new clone of the document fragment.
 * @private
 * @type {Function}
 * @returns {DocumentFragment}
 */
const template = (function(html) {
  let t = document.createElement('template');
  t.innerHTML = html;
  return () => t.content.cloneNode(true);
})(`
<style>
:host {
  position: relative;
  display: block;
  margin: 0;
  padding: 0;
  user-select: none;
}
#gameboard {
  position: absolute;
  width: 100%; height: 100%;
}
</style>
<div id="gameboard">
</div>
`);

export default TicTacToe;
customElements.define('tic-tac-toe', TicTacToe);
