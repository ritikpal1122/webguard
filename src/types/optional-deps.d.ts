declare module "lighthouse" {
  const lighthouse: any;
  export default lighthouse;
}

declare module "chrome-launcher" {
  export function launch(opts?: any): Promise<any>;
}
