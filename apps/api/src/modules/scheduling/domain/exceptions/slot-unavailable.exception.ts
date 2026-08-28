import { DomainException } from "../../../../shared/exceptions/domain-exception";

export class SlotUnavailableException extends DomainException {
  constructor(message = "No free slot is available for that date") {
    super(message, "SCHEDULING.SLOT_UNAVAILABLE");
  }
}
