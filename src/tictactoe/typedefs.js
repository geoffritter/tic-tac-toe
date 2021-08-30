/**
 * A score representing the state of the board's ways to win. A 3 or -3 in any index means the game was won.
 * @typedef Score
 * @type {array}
 * @property {number} 0 Row 1
 * @property {number} 1 Row 2
 * @property {number} 2 Row 3
 * @property {number} 3 Column 1
 * @property {number} 4 Column 2
 * @property {number} 5 Column 3
 * @property {number} 6 Backslash Diagonal
 * @property {number} 7 Forwardslash Diagonal
 */

/**
 * Winner value.
 * @typedef Winner
 * @enum {number}
 * @property {undefined} undefined The game is not over, there is no winner.
 * @property {number} -1 There is no winner.
 * @property {number} 0 The first player won.
 * @property {number} 1 The second player won.
 */

/**
 * A method on the Player object that will pick a move based on the current board state.
 * @typedef AlgorithmMethod
 * @type {Function}
 */

export default {};