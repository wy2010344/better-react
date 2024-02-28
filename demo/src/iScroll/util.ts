// ref https://github.com/WICG/EventListenerOptions/pull/30
function isPassive() {
  var supportsPassiveOption = false;
  try {
    //@ts-ignore
    addEventListener("test", null, Object.defineProperty({}, 'passive', {
      get: function () {
        supportsPassiveOption = true;
      }
    }));
  } catch (e) { }
  return supportsPassiveOption;
}
