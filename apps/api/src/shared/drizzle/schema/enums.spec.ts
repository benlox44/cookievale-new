import {
  DELIVERY_METHOD_VALUES,
  ORDER_STATUS_VALUES,
} from "@cookievale/shared";
import { describe, expect, it } from "vitest";

import { deliveryMethodEnum, orderStatusEnum } from "./enums";

/** Guards against the DB enum drifting from the shared package. */
describe("pg enums mirror the shared package", () => {
  it("order_status matches ORDER_STATUS_VALUES", () => {
    expect(orderStatusEnum.enumValues).toEqual([...ORDER_STATUS_VALUES]);
  });

  it("delivery_method matches DELIVERY_METHOD_VALUES", () => {
    expect(deliveryMethodEnum.enumValues).toEqual([...DELIVERY_METHOD_VALUES]);
  });
});
