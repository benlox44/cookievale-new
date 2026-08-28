import { DomainException } from "../../../../shared/exceptions/domain-exception";

export class OrderNotFoundException extends DomainException {
  constructor(message = "Order not found") {
    super(message, "ORDERS.NOT_FOUND");
  }
}
