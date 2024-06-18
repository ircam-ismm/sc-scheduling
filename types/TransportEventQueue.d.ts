/**
 * @private
 * Dedicated queue for the Transport
 */
export default class TransportControlEventQueue {
    constructor(currentTime: any);
    state: {
        eventType: any;
        time: any;
        position: number;
        speed: number;
        loop: boolean;
        loopStart: number;
        loopEnd: number;
    };
    previousState: any;
    scheduledEvents: any[];
    speed: number;
    get next(): any;
    add(event: any): any;
    dequeue(): any;
    getPositionAtTime(time: any): number;
    getTimeAtPosition(position: any): any;
}
//# sourceMappingURL=TransportEventQueue.d.ts.map