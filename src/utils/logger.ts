import { c } from "./colors.js";

export const log = {
  info(msg: string) {
    console.log(c.blue("i"), msg);
  },
  success(msg: string) {
    console.log(c.green("✓"), msg);
  },
  warn(msg: string) {
    console.log(c.yellow("⚠"), msg);
  },
  error(msg: string) {
    console.log(c.red("✗"), msg);
  },
  dim(msg: string) {
    console.log(c.dim(msg));
  },
  plain(msg: string) {
    console.log(msg);
  },
};
