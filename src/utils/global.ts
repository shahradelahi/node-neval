export function defineGlobally(key: string | symbol, obj: any) {
  [
    typeof globalThis === 'object' ? globalThis : null,
    typeof global === 'object' ? global : null,
    typeof window === 'object' ? window : null,
    typeof self === 'object' ? self : null,
  ].forEach((context) => {
    if (!context) return;
    Object.defineProperty(context, key, {
      value: obj,
      enumerable: true,
    });
  });
}
