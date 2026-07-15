const fs = require('fs');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');
const vm = require('vm');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { JSDOM } = require('jsdom');

function createMockAudioContext() {
  return function() {
    return {
      createGain: () => ({
        gain: {
          value: 0,
          setValueAtTime: () => {},
          linearRampToValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          setTargetAtTime: () => {}
        },
        connect: () => {}
      }),
      createOscillator: () => ({
        connect: () => {},
        start: () => {},
        stop: () => {},
        type: 'sine',
        frequency: {
          value: 0,
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          linearRampToValueAtTime: () => {}
        }
      }),
      createBiquadFilter: () => ({
        connect: () => {},
        type: 'lowpass',
        frequency: { value: 0, setValueAtTime: () => {} },
        Q: { value: 0, setValueAtTime: () => {} }
      }),
      createBufferSource: () => ({
        buffer: null,
        loop: false,
        connect: () => {},
        start: () => {},
        stop: () => {}
      }),
      decodeAudioData: (buffer) => Promise.resolve({ duration: 5 }),
      destination: {},
      currentTime: 0,
      state: 'running',
      resume: () => Promise.resolve()
    };
  };
}

function loadAppIntoDom(options = {}) {
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf-8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost' });

  const window = dom.window;
  const document = dom.window.document;

  if (options.localStorage) {
    Object.entries(options.localStorage).forEach(([key, value]) => {
      window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
  }

  window.matchMedia = window.matchMedia || (() => ({ matches: true, addListener: () => {}, removeListener: () => {} }));
  window.Notification = { permission: 'denied', requestPermission: () => Promise.resolve('denied') };
  window.AudioContext = createMockAudioContext();
  window.webkitAudioContext = createMockAudioContext();
  window.confirm = () => true;

  // Mock fetch for audio files
  window.fetch = (url) => {
    if (url.startsWith('audio/')) {
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
      });
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  };

  const constantsJs = fs.readFileSync(path.join(__dirname, '..', '..', 'constants.js'), 'utf-8');
  const appJs = fs.readFileSync(path.join(__dirname, '..', '..', 'app.js'), 'utf-8');
  const enhancementsJs = fs.readFileSync(path.join(__dirname, '..', '..', 'enhancements.js'), 'utf-8');

  const context = {
    window, document, navigator: window.navigator, localStorage: window.localStorage,
    Notification: window.Notification, AudioContext: window.AudioContext,
    webkitAudioContext: window.webkitAudioContext, matchMedia: window.matchMedia,
    confirm: window.confirm, fetch: window.fetch, alert: () => {}, console,
    setTimeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window),
    setInterval: window.setInterval.bind(window), clearInterval: window.clearInterval.bind(window),
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}
  };
  context.window.document = document;

  const vmContext = vm.createContext(context);
  vm.runInContext(constantsJs, vmContext);
  vm.runInContext(appJs, vmContext);
  vm.runInContext(enhancementsJs, vmContext);

  document.dispatchEvent(new window.Event('DOMContentLoaded'));

  window.playBellSound = vmContext.playBellSound;
  window.startAmbientSound = vmContext.startAmbientSound;
  window.stopAmbientSound = vmContext.stopAmbientSound;
  window.preloadAudioFiles = vmContext.preloadAudioFiles;

  return {
    dom, window, document, vmContext,
    get state() { return window.state; },
    get AUDIO_FILE_MAP() { return window.AUDIO_FILE_MAP; },
    get getAudioFormat() { return window.getAudioFormat; },
    get playBellSound() { return window.playBellSound; },
    get startAmbientSound() { return window.startAmbientSound; },
    get stopAmbientSound() { return window.stopAmbientSound; },
    get preloadAudioFiles() { return window.preloadAudioFiles; }
  };
}

describe('Audio Format Detection', () => {
  test('getAudioFormat returns mp3 or ogg', () => {
    const { getAudioFormat } = loadAppIntoDom();
    const format = getAudioFormat();
    expect(['mp3', 'ogg']).toContain(format);
  });
});

describe('Audio File Map', () => {
  test('contains all bell sound keys', () => {
    const { AUDIO_FILE_MAP } = loadAppIntoDom();
    expect(AUDIO_FILE_MAP['singing-bowl']).toBe('bells/singing-bowl');
    expect(AUDIO_FILE_MAP['soft-gong']).toBe('bells/soft-gong');
    expect(AUDIO_FILE_MAP['bell']).toBe('bells/temple-bell');
  });

  test('contains all ambient sound keys', () => {
    const { AUDIO_FILE_MAP } = loadAppIntoDom();
    expect(AUDIO_FILE_MAP['rain']).toBe('ambient/rain');
    expect(AUDIO_FILE_MAP['waves']).toBe('ambient/waves');
    expect(AUDIO_FILE_MAP['forest']).toBe('ambient/forest');
    expect(AUDIO_FILE_MAP['wind']).toBe('ambient/wind');
    expect(AUDIO_FILE_MAP['zen']).toBe('ambient/zen');
    expect(AUDIO_FILE_MAP['fire']).toBe('ambient/fire');
    expect(AUDIO_FILE_MAP['brownNoise']).toBe('ambient/brown-noise');
    expect(AUDIO_FILE_MAP['chants']).toBe('ambient/chants');
  });

  test('brownNoise maps to kebab-case filename', () => {
    const { AUDIO_FILE_MAP } = loadAppIntoDom();
    expect(AUDIO_FILE_MAP['brownNoise']).toBe('ambient/brown-noise');
  });
});

describe('Buffer Playback', () => {
  test('playBellSound does nothing when bellSound is silence', () => {
    const { state, playBellSound } = loadAppIntoDom();
    state.audio.bellSound = 'silence';
    // Should not throw
    playBellSound();
  });

  test('startAmbientSound does nothing when ambientSound is silence', () => {
    const { state, startAmbientSound } = loadAppIntoDom();
    state.audio.ambientSound = 'silence';
    startAmbientSound();
    expect(state.audio.isAmbientPlaying).toBe(false);
  });

  test('stopAmbientSound handles no active source gracefully', () => {
    const { state, stopAmbientSound } = loadAppIntoDom();
    state.audio.activeAmbientSource = null;
    stopAmbientSound();
    expect(state.audio.isAmbientPlaying).toBe(false);
  });
});
