export default TransportEvent;
/**
 * Event emitted by the Transport when a change occurs
 * @hideconstructor
 */
declare class TransportEvent {
    /** @private */
    private constructor();
    /**
     * Type of the event
     * @type {string}
     */
    get type(): string;
    /**
     * Time of the event
     * @type {number}
     */
    get time(): number;
    /**
     * Position of the event in timeline
     * @type {number}
     */
    get position(): number;
    /**
     * Current speed of the transport (0 is stopped or paused, 1 if started)
     * @type {number}
     */
    get speed(): number;
    /**
     * Wether the transport is looping
     * @type {boolean}
     */
    get loop(): boolean;
    /**
     * Start position of the loop
     * @type {number}
     */
    get loopStart(): number;
    /**
     * Stop position of the loop
     * @type {number}
     */
    get loopEnd(): number;
    /**
     * Delta time between tick time and event time, in seconds
     * @type {number}
     */
    get tickLookahead(): number;
    #private;
}
//# sourceMappingURL=TransportEvent.d.ts.map