export default {
  command: {
    type: 'string', // 'start', 'stop', 'pause'
    default: 'stop',
    filterChange: false, // we want to be able to seek as many time as we want
  },
  mtcApplyAt: {
    type: 'float',
    event: true,
  },
  seekPosition: {
    type: 'float',
    default: 0,
    filterChange: false,
  },
  clockEvents: {
    type: 'any',
    default: null,
    nullable: true,
  },
  enablePreRoll: {
    type: 'boolean',
    default: false,
  },
  preRollDuration: {
    type: 'float',
    default: 4,
    min: 0,
  },
  preRollEvents: {
    type: 'any',
    default: null,
    nullable: true,
  },
  loopStart: {
    type: 'float',
    default: 0,
  },
  loopEnd: {
    type: 'float',
    default: 0,
  },
  loop: {
    type: 'boolean',
    default: false,
  },

  // store transport current state and scheduled events
  transportState: {
    type: 'any',
    default: {},
  },
};
