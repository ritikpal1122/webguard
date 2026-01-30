// Lightweight ANSI color utility — avoids chalk v5 ESM/CJS interop issues
const enabled =
  process.env.NO_COLOR === undefined &&
  process.env.FORCE_COLOR !== "0" &&
  process.stdout.isTTY !== false;

function wrap(open: string, close: string) {
  return enabled ? (s: string) => `${open}${s}${close}` : (s: string) => s;
}

export const c = {
  bold: wrap("\x1b[1m", "\x1b[22m"),
  dim: wrap("\x1b[2m", "\x1b[22m"),
  red: wrap("\x1b[31m", "\x1b[39m"),
  green: wrap("\x1b[32m", "\x1b[39m"),
  yellow: wrap("\x1b[33m", "\x1b[39m"),
  blue: wrap("\x1b[34m", "\x1b[39m"),
  cyan: wrap("\x1b[36m", "\x1b[39m"),
  gray: wrap("\x1b[90m", "\x1b[39m"),
  bgRed: wrap("\x1b[41m", "\x1b[49m"),
  bgGreen: wrap("\x1b[42m", "\x1b[49m"),
};
