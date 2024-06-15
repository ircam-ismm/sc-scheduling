# sc-scheduling

Simple library to schedule events in Node.js and the browser.

## Install

```
npm install --save @ircam/sc-scheduling
```

## Example Use

```js
import { Scheduler } from '@ircam/sc-scheduling';

const audioContext = new AudioContext();
// create a scheduler in the timeline of the audio context
const scheduler = new Scheduler(() => audioContext.currentTime);
// schedule an audio event to be scheduler every seconds
schedule.add(currentTime => {
  doSomethingAtCurrentTime(currentTime);
  // ask to be called back in 1 second from currentTime
  return currentTime + 1;
});
```

## Terminology

- `time` refers to the timeline of the parent
- `position` refers to the timeline of the children

- `Transport` is the thing that control timelines or engines with play / pause / etc.
- `Timeline` is an abstraction that can host abstractions and place them in time according to each others

## API

<!-- api -->
<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

*   [SchedulerProcessor][1]
    *   [Parameters][2]
*   [Scheduler][3]
    *   [Parameters][4]
    *   [period][5]
    *   [lookahead][6]
    *   [currentTime][7]
    *   [audioTime][8]
    *   [processorTime][9]
    *   [defer][10]
    *   [has][11]
    *   [add][12]
    *   [reset][13]
    *   [remove][14]
    *   [clear][15]
*   [SchedulerEvent][16]
    *   [tickLookahead][17]
*   [Transport][18]
    *   [Parameters][19]
    *   [Examples][20]
    *   [dumpState][21]
    *   [scheduler][22]
    *   [currentTime][23]
    *   [audioTime][24]
    *   [start][25]
    *   [stop][26]
    *   [pause][27]
    *   [seek][28]
    *   [loop][29]
    *   [loopStart][30]
    *   [loopEnd][31]
    *   [speed][32]
    *   [cancel][33]
    *   [addEvent][34]
    *   [addEvents][35]
    *   [getPositionAtTime][36]
    *   [add][37]
    *   [has][38]
    *   [remove][39]
    *   [clear][40]
*   [TransportEvent][41]
    *   [Parameters][42]
    *   [type][43]
    *   [time][44]
    *   [position][45]
    *   [speed][46]
    *   [loop][47]
    *   [loopStart][48]
    *   [loopEnd][49]
    *   [tickLookahead][50]

## SchedulerProcessor

Processor to add into a [Scheduler][3].

The processor will be called back by the Scheduler at the time it request,
do some processing and return the next time at which it wants to be called back.

Note that the APIs of the `SchedulerProcessor` and of a `TransportProcessor`
are made in such way that it is possible to implement generic processors that
can be added both to a `Scheduler` and to a `Transport`.

Type: [function][51]

### Parameters

*   `currentTime` **[number][52]** Current time in the timeline of the scheduler
*   `processorTime` **[number][52]** Current time in the timeline of the processor
    if it has to trigger events in a different timeline, see
    `Scheduler#options.currentTimeToProcessorTimeFunction`.
*   `event` **[SchedulerEvent][16]** Event that holds informations about the current
    processor call.

## Scheduler

The `Scheduler` interface implements a lookahead scheduler that can be used to
schedule events in an arbitrary timelines.

It aims at finding a tradeoff between time precision, real-time responsiveness
and the weaknesses of the native timers (i.e. `setTimeout` and `setInterval`)

For an in-depth explaination of the pattern, see [https://web.dev/audio-scheduling/][53]

### Parameters

*   `getTimeFunction` **[function][51]** Function that returns a time in seconds,
    defining the timeline in which the scheduler is running.
*   `$1` **[Object][54]**  (optional, default `{}`)

    *   `$1.period`   (optional, default `0.025`)
    *   `$1.lookahead`   (optional, default `0.1`)
    *   `$1.queueSize`   (optional, default `1e3`)
    *   `$1.currentTimeToProcessorTimeFunction`   (optional, default `identity`)
    *   `$1.currentTimeToAudioTimeFunction`   (optional, default `null`)
    *   `$1.maxRecursions`   (optional, default `100`)
    *   `$1.verbose`   (optional, default `false`)
*   `options` **[object][54]** Options of the scheduler

### period

Minimum period at which the scheduler checks for events, in seconds.
Throws if negative or greater than lookahead.

Type: [number][52]

### lookahead

Lookahead duration in seconds.
Throws if negative or lower than period.

Type: [number][52]

### currentTime

Current time in the scheduler timeline.

Basically an accessor for `getTimeFunction` parameter given in constructor.

Type: [number][52]

### audioTime

\[deprecated] Scheduler current audio time according to `currentTime`

Type: [number][52]

### processorTime

Processor time according to `currentTime` and the transfert functioin
provided in `options.currentTimeToProcessorTimeFunction`.

If `options.currentTimeToProcessorTimeFunction` has not been set, is equal
to `currentTime`.

Type: [number][52]

### defer

Execute a function once at a given time.

Calling `defer` compensates with a `setTimeout` for the tick lookahead
introduced by the scheduling. Can be usefull for example to synchronize
audio events which natively scheduled with visuals which have no internal
timing/scheduling ability.

Be aware that this method will introduce small timing error of 1-2 ms order
of magnitude due to the `setTimeout`.

#### Parameters

*   `deferedProcessor` **[SchedulerProcessor][1]** Callback function to schedule.
*   `time` **[number][52]** Time at which the callback should be scheduled.

#### Examples

```javascript
const scheduler = new Scheduler(getTime);

scheduler.add((currentTime, audioTime) => {
  // schedule some audio event
  playSomeSoundAt(audioTime);
  // defer execution of visual display to compensate the tickLookahead
  scheduler.defer(displaySomeSynchronizedStuff, currentTime);
  // ask the scheduler to call back in 1 second
  return currentTime + 1;
});
```

### has

Check whether a given processor has been added to this scheduler

#### Parameters

*   `processor` **[SchedulerProcessor][1]** Processor to test.

Returns **[boolean][55]**&#x20;

### add

Add a processor to the scheduler.

Note that given `time` is considered a logical time and that no particular
checks are made on it as it might break synchronization between several
processors. So if the given time is in the past, the processor will be called
in a recursive loop until it reaches current time.
This is the responsibility of the consumer code to handle such possible issues.

#### Parameters

*   `processor` **[SchedulerProcessor][1]** Processor to add to the scheduler
*   `time` **[number][52]** Time at which the processor should be launched. (optional, default `this.currentTime`)
*   `priority` **[Number][52]** Additional priority in case of equal time between
    two processor. Higher priority means the processor will processed first. (optional, default `0`)

### reset

Reset next time of a given processor.

If time is not a number, the processor is removed from the scheduler.

Note that given `time` is considered a logical time and that no particular
checks are made on it as it might break synchronization between several
processors. So if the given time is in the past, the processor will be called
in a recursive loop until it reaches current time.
This is the responsibility of the consumer code to handle such possible issues.

Be aware that calling this method within a processor callback function won't
work, because the reset will always be overriden by the processor return value.

#### Parameters

*   `processor` **[SchedulerProcessor][1]** The processor to reschedule
*   `time` **[number][52]** Time at which the processor must be rescheduled (optional, default `undefined`)

### remove

Remove a processor from the scheduler.

#### Parameters

*   `processor` **[SchedulerProcessor][1]** The processor to reschedule

### clear

Clear the scheduler.

## SchedulerEvent

Scheduler information provided as third argument of a callback registered
in the scheduler

### tickLookahead

Delta time between tick time and current time, in seconds

Type: [Number][52]

## Transport

The Transport abstraction allows to define and manipulate a timeline.

### Parameters

*   `scheduler` **[Scheduler][3]** Instance of scheduler into which the transport
    should run
*   `initialState` **[object][54]** Initial state of the transport, to synchronize
    it from another transport state (see `Transport#dumpState()`). (optional, default `null`)

### Examples

```javascript
import { Scheduler, Transport, TransportEvent } from '@ircam/sc-scheduling';
import { getTime } from '@ircam/sc-utils';

const scheduler = new Scheduler(getTime);
const transport = new Transport(scheduler);

const engine = (position, time, infos) => {
  if (infos instanceof TransportEvent) {
     // ask to be called back only when the transport is running
     return infos.speed > 0 ? position : Infinity;
  }

  console.log(position);
  return position + 0.1; // ask to be called back every 100ms
}
```

### dumpState

Retrieves the current state and event queue for the transport

### scheduler

Underlying scheduler

Type: [Scheduler][3]

### currentTime

Scheduler current time

Type: [Scheduler][3]

### audioTime

Scheduler current audio time

Type: [Scheduler][3]

### start

Start the transport at a given time

#### Parameters

*   `time` **[number][52]** Time to execute the command

### stop

Stop the transport at a given time, position will be reset to zero

#### Parameters

*   `time` **[number][52]** Time to execute the command

### pause

Pause the transport at a given time, position will remain untouched

#### Parameters

*   `time` **[number][52]** Time to execute the command

### seek

Seek to a new position in the timeline

#### Parameters

*   `time` **[number][52]** Time to execute the command
*   `position` **[number][52]** New position

### loop

Toggle the transport loop at a given time

#### Parameters

*   `time` **[number][52]** Time to execute the command
*   `value` &#x20;
*   `loop` **[boolean][55]** Loop state

### loopStart

Define the transport loop start point at a given time

#### Parameters

*   `time` **[number][52]** Time to execute the command
*   `position` **[number][52]** Position of loop start point

### loopEnd

Define the transport loop end point at a given time

#### Parameters

*   `time` **[number][52]** Time to execute the command
*   `position` **[number][52]** Position of loop end point

### speed

Define the transport speed at a given time

*Experimental*

#### Parameters

*   `time` **[number][52]** Time to execute the command
*   `value` **[number][52]** Speed to transport time

### cancel

Cancel all event currently scheduled after the given time

#### Parameters

*   `time` **[number][52]** Time to execute the command

### addEvent

Add raw event to the transport queue.

Most of the time, you should use the dedicated higher level methods. However
this is useful to control several transports from a central event producer
(e.g. on the network)

#### Parameters

*   `event` &#x20;

### addEvents

Add a list raw event to the transport queue.

#### Parameters

*   `eventList` &#x20;

### getPositionAtTime

Return estimated position at given time according to the transport current state.

#### Parameters

*   `time` **[number][52]** Time to convert to position

### add

Add an engine to the transport.

When a processor is added to the transport, it called with an 'init' event
to allow it to respond properly to the current state of the transport.
For example, if the transport has already been started.

#### Parameters

*   `engine` **[function][51]** Engine to add to the transport

<!---->

*   Throws **any** Throw if the engine has already been added to this or another transport

### has

Define if a given engine has been added to the transport

#### Parameters

*   `engine` **[function][51]** Engine to check

Returns **[boolean][55]**&#x20;

### remove

Remove an engine from the transport

#### Parameters

*   `engine` **[function][51]** Engine to remove from the transport

<!---->

*   Throws **any** Throw if the engine has not been added to the transport

### clear

Remove all engines, cancel all registered transport event and pause transport

## TransportEvent

Event emitted by the Transport when a change occurs

### Parameters

*   `transportState` &#x20;
*   `tickLookahead` &#x20;

### type

Type of the event

Type: [string][56]

### time

Time of the event

Type: [number][52]

### position

Position of the event in timeline

Type: [number][52]

### speed

Current speed of the transport (0 is stopped or paused, 1 if started)

Type: [number][52]

### loop

Wether the transport is looping

Type: [boolean][55]

### loopStart

Start position of the loop

Type: [number][52]

### loopEnd

Stop position of the loop

Type: [number][52]

### tickLookahead

Delta time between tick time and event time, in seconds

Type: [number][52]

[1]: #schedulerprocessor

[2]: #parameters

[3]: #scheduler

[4]: #parameters-1

[5]: #period

[6]: #lookahead

[7]: #currenttime

[8]: #audiotime

[9]: #processortime

[10]: #defer

[11]: #has

[12]: #add

[13]: #reset

[14]: #remove

[15]: #clear

[16]: #schedulerevent

[17]: #ticklookahead

[18]: #transport

[19]: #parameters-7

[20]: #examples-1

[21]: #dumpstate

[22]: #scheduler-1

[23]: #currenttime-1

[24]: #audiotime-1

[25]: #start

[26]: #stop

[27]: #pause

[28]: #seek

[29]: #loop

[30]: #loopstart

[31]: #loopend

[32]: #speed

[33]: #cancel

[34]: #addevent

[35]: #addevents

[36]: #getpositionattime

[37]: #add-1

[38]: #has-1

[39]: #remove-1

[40]: #clear-1

[41]: #transportevent

[42]: #parameters-23

[43]: #type

[44]: #time

[45]: #position

[46]: #speed-1

[47]: #loop-1

[48]: #loopstart-1

[49]: #loopend-1

[50]: #ticklookahead-1

[51]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function

[52]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number

[53]: https://web.dev/audio-scheduling/

[54]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[55]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean

[56]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

<!-- apistop -->


## License

[BSD-3-Clause](./LICENSE)
