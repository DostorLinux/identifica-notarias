const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for assets double path issue
config.resolver.platforms = [...config.resolver.platforms, 'web'];

// Asset configuration to prevent double path
config.resolver.assetExts.push('ttf', 'woff', 'woff2');

// Web-specific asset handling
config.transformer.assetRegistryPath = ['./assets'];

module.exports = config;