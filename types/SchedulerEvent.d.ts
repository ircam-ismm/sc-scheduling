export const kTickLookahead: any;
/**
 * Scheduler information provided as third argument of a callback registered
 * in the scheduler
 */
export default class SchedulerEvent {
    /**
     * Delta time between tick time and current time, in seconds
     * @type {Number}
     */
    get tickLookahead(): number;
}
//# sourceMappingURL=SchedulerEvent.d.ts.map