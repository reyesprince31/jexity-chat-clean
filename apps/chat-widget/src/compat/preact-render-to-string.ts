/**
 * Stub module to satisfy preact/compat's SSR entry points within the browser bundle.
 * The chat widget only targets client-side rendering, so calling these helpers
 * is treated as a misuse.
 */
const notSupported = () => {
  throw new Error(
    "Server-side rendering helpers are not available in the chat-widget bundle."
  );
};

export const render = notSupported;
export const renderToStaticMarkup = notSupported;
export const renderToString = notSupported;
export default renderToString;
