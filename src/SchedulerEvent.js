const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');
export const kTickLookahead = Symbol('sc-scheduling:tick-lookahead');

/**
 * Scheduler information provided as third argument of a callback registered
 * in the scheduler
 */
export default class SchedulerEvent {
  constructor() {
    this[kTickLookahead] = 0;
  }

  /**
   * Delta time between tick time and current time, in seconds
   * @type {Number}
   */
  get tickLookahead() {
    return this[kTickLookahead];
  }

  [customInspectSymbol]() {
    return `SchedulerEvent { tickLookahead: ${this.tickLookahead} }`;
  }
}

