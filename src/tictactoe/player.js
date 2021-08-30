import {BadPlayerInit} from './errors.js';


/**
 * A simple opponent to play the game with.
 */
class Player {
  /**
   * The algorithm picked based on skill level. It is assigned one of the 'pick' methods.
   * @type {AlgorithmMethod}
   */
  #algorithm;

  /**
   * Runtime defined function to optimally sum the score array without using a loop. I mean... tic-tac-toe surely will
   * never be bigger than a 3x3 grid with 2 diagonals, hard coding this unrolled loop would work just as well. This is
   * used by getMoveRank in determining the best move.
   * @func
   * @param {Score} score the array to sum.
   * @param {number} bonus A bonus value to add to the sum.
   */
  #sumScore;

  /**
   * Create a player.
   * @param {TicTacToe} game 
   * @param {number} player The player number: 0 = first player, > 0 = second player.
   * @param {number} skillLevel  The level of player to choose 0, 1, 2. Larger numbers is the same as 0.
   */
  constructor(game, player, skillLevel) {
    if (game && game.nodeName === 'TIC-TAC-TOE') {
      this.game = game;
    } else {
      throw new BadPlayerInit();
    }
    this.player = player > 0 ? 1 : 0;
    switch(skillLevel) {
      case 0:
        this.#algorithm = this.pickFirstAvailable;
        break;
      case 1:
        this.#algorithm = this.pickRandom;
        break;
      case 2:
        this.#algorithm = this.pickBest;
        break;
      default:
        this.#algorithm = this.pickFirstAvailable;
        break;
    }

    // Define the #sumScore based on the supplied game.
    let returnSum = "return ((bonus || 0) | 0)";
    for (let i = 0, l = game.score.length; i < l; i++) {
      returnSum += ` + score[${i}]`;
    }
    this.#sumScore = new Function("score", "bonus", returnSum);
  }

  /**
   * Performs the move based on the player level.
   */
  move() {
    this.game.doTurn(this.player, this.#algorithm());
  }

  /**
   * This is vitually useless to play against and offers no challenge.
   * @type {AlgorithmMethod}
   * @returns {HTMLElement} The first open square on the board.
   */
  pickFirstAvailable() {
    return this.game.getEmptySquares()[0];
  }

  /**
   * Picks a random open square on the board.
   * @type {AlgorithmMethod}
   * @returns {HTMLElement} A random open grid square.
   */
  pickRandom() {
    let squares = this.game.getEmptySquares();
    let index = Math.random() * squares.length | 0;
    return squares[index];
  }

  /**
   * Picks the best square to move for the player.
   * @type {AlgorithmMethod}
   * @returns {HTMLElement} The grid square of the best possible move.
   */
  pickBest() {
    let bestScore = this.getMoveRank();
    let square;
    let squares = this.game.getEmptySquares();
    // console.log(this.game.turn + ': ' + bestScore + ' ----------------');
    // console.log(this.game.score);
    for (let i = 0; i < squares.length; i++) {
      let score = this.getMoveRank(squares[i].id);
      if (this.player === 0) {
        // For first player
        if (score > bestScore) {
          bestScore = score;
          square = squares[i];
        }
      } else {
        // For second player
        if (score < bestScore) {
          bestScore = score;
          square = squares[i];
        }
      }
      // Random flip for equal opportunity.
      if (score === bestScore) {
        if (Math.random() > 0.5) {
          square = squares[i];
        }
      }
    }
    return square || this.pickRandom();
  }

  /**
   * Get a number representing how good a particular move would be if player chose that square. Positive numbers are good for first player, Negative numbers good for second player.
   * @param {string} gridId The Grid square's html element Id.
   * @returns {number} A number representing the rank of the move.
   */
  getMoveRank (gridId) {
    // Sway value: If First player, we want to increase. If Second Player, we want to decrease.
    let s = this.player === 0 ? 1 : -1;
    let score = this.game.score;

    // Early exit if we just want to see the current grid score with no move.
    if (!gridId) { return this.#sumScore(score); }

    // Counts the total number of opposite player paired squares.
    let totalOpponentTwos = () => {
      let n = 0;
      score.forEach(x => x === 2 * s * -1 ? n++ : 0);
      return n;
    }

    // Counts the total number of zeros in the score array. This hints at the state of the board.
    let totalZeros = () => {
      let n = 0;
      score.forEach(x => x === 0 ? n++ : 0);
      return n;
    }
    let baseOpponentTwos = totalOpponentTwos();

    let corners = ['g00', 'g20', 'g02', 'g22'];
    let player0cornerbias = (() => {
      if (score[6] > score[7]) { return ['g00', 'g22']; }
      else if (score[7] > score[6]) { return ['g20', 'g02']; }
      return [];
    })();

    let bonus = 0;

    // Must match method used by game.
    let g1 = parseInt(gridId[1], 10);
    let g2 = parseInt(gridId[2], 10);
    score[g2] += s;
    score[g1 + 3] += s;
    if (g1 === g2) {
      score[6] += s;
    }
    if (g1 + g2 === 2) {
      score[7] += s;
    }

    // If turn 0, play in random corner. This is always the best move for simplicity.
    if (this.game.turn === 0 && corners.includes(gridId)) {
      bonus +=  s * Math.random() * 10 | 0;
    }
    // If turn 1, score total will pick center. Or any available corner if center is picked.
    // If turn 2, play in opposite corner. Strongest play with turn 0.
    if (this.game.turn === 2 && player0cornerbias.includes(gridId)) {
      bonus += s * 10;
    }
    // If turn 3,
    if (this.game.turn === 3) {
      // Negatively weight if diagonal scores when 6 and 7 are -2 and 1.
      // First Player is playing opposite diagonal. We don't want to play diagonally.
      if (score[6] + score[7] === -1) {
        bonus += 2;
      }
      // Postively weight more than 5 zeros in score array.
      // First Player is playing an L. And this score is the best.
      if (totalZeros() >= 5) {
        bonus -= 2;
      }
    }
    // Always block opponent if they have any pair in row, column, or diagonal.
    if (totalOpponentTwos() < baseOpponentTwos) {
      bonus +=  s * 20;
    }
    // Always choose to win the game if you can make 3 match.
    if (score.includes(3 * s)) {
      bonus += s * 30;
    }
    // console.log(`${gridId} ${this.#sumScore(score)} + ${bonus}  : total2s ${totalOpponentTwos()} ${baseOpponentTwos}  : ${score[0]} ${score[1]} ${score[2]} ${score[3]} ${score[4]} ${score[5]} ${score[6]} ${score[7]}`);
    return this.#sumScore(score, bonus);
  }
}


export default Player;
