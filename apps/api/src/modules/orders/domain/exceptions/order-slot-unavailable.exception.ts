import { DomainException } from "../../../../shared/exceptions/domain-exception";

export class OrderSlotUnavailableException extends DomainException {
  constructor(message = "The selected slot is no longer available") {
    super(message, "ORDERS.SLOT_UNAVAILABLE");
  }
}
