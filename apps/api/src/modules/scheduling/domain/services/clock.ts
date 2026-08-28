export const CLOCK = Symbol("CLOCK");

export interface Clock {
  /** Today in the shop's timezone as `YYYY-MM-DD`. */
  today(): string;
}
