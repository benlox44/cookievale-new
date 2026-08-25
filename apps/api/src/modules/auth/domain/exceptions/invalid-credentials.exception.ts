import { DomainException } from "../../../../shared/exceptions/domain-exception";

export class InvalidCredentialsException extends DomainException {
  constructor(message = "Incorrect password") {
    super(message, "AUTH.INVALID_CREDENTIALS");
  }
}
