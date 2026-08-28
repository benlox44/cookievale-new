import { type Clock } from "../../domain/services/clock";

export class ShopClock implements Clock {
  constructor(private readonly timeZone: string) {}

  today(): string {
    /** en-CA renders YYYY-MM-DD; the timeZone pins it to the shop's day boundary. */
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: this.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
}
