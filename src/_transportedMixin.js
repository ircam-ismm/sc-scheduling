
export default obj => {

  if (obj.prototype) {
    obj = obj.prototype;
  }

  const mixin = {
    //
    // _startPosition:
    // resetTime(time, audioTime, dt) {

    // }

    setBoundaries(start, offset, duration) {
      this.startTime = start;
      this.offset = offset;
      this.duration = duration;

      this.master.resetEngineTime(this);
    }
  }

    // @todo - test every possible syntax to keep `this` safe
  Object.assign(obj, mixin);
  // enable const MyClass = scheduledMixin(class { ... });
  if (obj.constructor) {
    return obj.constructor;
  } else {
    return obj;
  }
}
