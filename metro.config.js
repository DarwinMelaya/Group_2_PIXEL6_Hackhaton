// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite on web ships a WebAssembly build of SQLite.
config.resolver.assetExts.push('wasm');

// expo-sqlite's *synchronous* API on web needs SharedArrayBuffer (cross-origin isolation).
// The app only uses async SQLite calls, so it also works on pages where Expo CLI omits these
// headers (e.g. `/`), but keep them so sync calls work wherever they are applied.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
