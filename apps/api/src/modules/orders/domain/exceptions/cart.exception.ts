import { DomainException } from "../../../../shared/exceptions/domain-exception";

export class CartException extends DomainException {
  constructor(message = "Invalid cart") {
    super(message, "ORDERS.CART_INVALID");
  }
}
