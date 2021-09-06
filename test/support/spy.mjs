const spy = fn => {
  function spy(...args) {
    spy.called = true;
    return fn.call(this, ...args);
  }
  spy.called = false;
  return spy;
};

export default spy;
