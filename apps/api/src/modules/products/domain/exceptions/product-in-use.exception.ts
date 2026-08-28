import { DomainException } from "../../../../shared/exceptions/domain-exception";

export class ProductInUseException extends DomainException {
  constructor(message = "Cannot delete a product that has orders") {
    super(message, "PRODUCTS.IN_USE");
  }
}
