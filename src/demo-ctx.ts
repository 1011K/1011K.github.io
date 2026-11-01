import type { Ticker } from "./content.ts";
// Contract between the demonstrations page and each demo module.
export interface Ctx {
  company(): Ticker;
  onCompany(cb: (t: Ticker) => void): void;
}
export type Mount = (root: HTMLElement, ctx: Ctx) => void;
