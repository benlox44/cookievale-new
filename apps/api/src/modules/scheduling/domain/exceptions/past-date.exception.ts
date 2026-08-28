import { DomainException } from "../../../../shared/exceptions/domain-exception";

export class PastDateException extends DomainException {
  constructor(message = "Cannot add a slot for a past date") {
    super(message, "SCHEDULING.PAST_DATE");
  }
}
