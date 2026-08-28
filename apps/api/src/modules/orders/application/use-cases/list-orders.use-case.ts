import { Inject, Injectable } from "@nestjs/common";

import { type Order } from "../../domain/entities/order";
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from "../../domain/repositories/order-repository";

const PAGE_SIZE = 50;

export interface ListOrdersInput {
  includeDelivered: boolean;
  page: number;
  sortBy: "id" | "date";
  sortDir: "asc" | "desc";
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: OrderRepository,
  ) {}

  async execute(input: ListOrdersInput): Promise<PaginatedOrders> {
    const [orders, total] = await Promise.all([
      this.repo.list({
        includeDelivered: input.includeDelivered,
        limit: PAGE_SIZE,
        offset: (input.page - 1) * PAGE_SIZE,
        sortBy: input.sortBy,
        sortDir: input.sortDir,
      }),
      this.repo.count(input.includeDelivered),
    ]);
    return {
      orders,
      total,
      page: input.page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  }
}
