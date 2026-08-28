import { DomainException } from "../../../../shared/exceptions/domain-exception";

export class ProductNotFoundException extends DomainException {
  constructor(message = "Product not found") {
    super(message, "PRODUCTS.NOT_FOUND");
  }
}
