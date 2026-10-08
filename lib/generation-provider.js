/**
 * Provider boundary for future integration. The UI consumes public capabilities.
 * A future browser adapter must call same-origin /api endpoints, never a provider
 * with a token. Cloudflare bindings/secrets belong only in Pages Functions.
 * generate(request, {signal}) -> {kind, mime, media, providerId, modelId,
 * provenance: 'real'|'sample', effectiveSettings} or a normalized coded Error.
 */
export const unavailableProvider = {
  getCapabilities(kind) {
    return { kind, status: 'unavailable', models: [], supportedSettings: [], message: `${kind === 'video' ? 'Video' : 'Image'} generation is not connected in this preview. You can prepare your draft, but no inference will run.` };
  },
  async generate() {
    const error = new Error('No generation provider is connected.');
    error.code = 'UNAVAILABLE';
    throw error;
  },
};
