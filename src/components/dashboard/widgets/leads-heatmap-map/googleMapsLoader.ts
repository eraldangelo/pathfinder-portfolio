const GOOGLE_MAPS_SCRIPT_ID = 'pathfinder-google-maps-sdk';
const GOOGLE_MAPS_INIT_CALLBACK = '__pathfinderGoogleMapsInit';

let googleMapsLoaderPromise: Promise<any> | null = null;

const getLoadedMaps = () => {
  const win = window as unknown as { google?: any };
  const maps = win.google?.maps;
  if (!maps) return null;
  if (typeof maps.Map !== 'function') return null;
  return maps;
};

export const loadGoogleMaps = (apiKey: string): Promise<any> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser.'));
  }

  const loadedMaps = getLoadedMaps();
  if (loadedMaps) return Promise.resolve(loadedMaps);
  if (googleMapsLoaderPromise) return googleMapsLoaderPromise;

  googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    const globalScope = window as unknown as {
      google?: any;
      gm_authFailure?: () => void;
      [GOOGLE_MAPS_INIT_CALLBACK]?: () => void;
    };

    const previousAuthFailureHandler = globalScope.gm_authFailure;
    let settled = false;
    let handleInit: (() => void) | null = null;
    let handleAuthFailure: (() => void) | null = null;

    const cleanup = () => {
      if (handleInit && globalScope[GOOGLE_MAPS_INIT_CALLBACK] === handleInit) {
        delete globalScope[GOOGLE_MAPS_INIT_CALLBACK];
      }
      if (handleAuthFailure && globalScope.gm_authFailure === handleAuthFailure) {
        if (previousAuthFailureHandler) {
          globalScope.gm_authFailure = previousAuthFailureHandler;
        } else {
          delete globalScope.gm_authFailure;
        }
      }
    };

    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      googleMapsLoaderPromise = null;
      cleanup();
      reject(new Error(message));
    };

    const completeIfReady = () => {
      const maps = getLoadedMaps();
      if (!maps || settled) return false;
      settled = true;
      cleanup();
      resolve(maps);
      return true;
    };

    const finish = () => {
      if (completeIfReady()) return;
      fail('Google Maps API is unavailable.');
    };

    handleAuthFailure = () => {
      previousAuthFailureHandler?.();
      fail('Google Maps API auth failed. Check API key restrictions, billing, and enabled APIs.');
    };
    globalScope.gm_authFailure = handleAuthFailure;
    handleInit = finish;
    globalScope[GOOGLE_MAPS_INIT_CALLBACK] = handleInit;

    if (existing) {
      if (completeIfReady()) return;
      existing.addEventListener(
        'load',
        () => {
          completeIfReady();
        },
        { once: true }
      );
      existing.addEventListener(
        'error',
        () => {
          fail('Failed to load Google Maps script.');
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=marker&callback=${GOOGLE_MAPS_INIT_CALLBACK}&loading=async&v=weekly`;
    script.onload = () => {
      completeIfReady();
    };
    script.onerror = () => {
      fail('Failed to load Google Maps script.');
    };
    document.head.appendChild(script);
  });

  return googleMapsLoaderPromise;
};
