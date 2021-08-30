/**
 * Indicates the miss use of the click handler function.
 */
export class HandlerMissuseError extends Error {
  constructor() {
    super('You can not use the static handler function directly. Please use the object\'s handler function');
    this.name = 'HandlerMissuseError';
  }
}

/**
 * Indicates the player was initialized wrong.
 */
export class BadPlayerInit extends Error {
  constructor() {
    super('The Player must be initialized with an instance of the game it is attached to.');
    this.name = 'BadPlayerInit';
  }
}
