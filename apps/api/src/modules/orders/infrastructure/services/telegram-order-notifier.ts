import { DELIVERY_METHOD } from "@cookievale/shared";
import { Inject, Injectable } from "@nestjs/common";

import {
  TELEGRAM_NOTIFIER,
  type TelegramNotifier,
} from "../../../../shared/telegram/telegram-notifier";
import { type Order } from "../../domain/entities/order";
import { type OrderNotifier } from "../../domain/services/order-notifier";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function money(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

// Local date parts (delivery_date is stored at local midnight, so UTC would drift).
function localDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${String(date.getFullYear())}-${month}-${day}`;
}

@Injectable()
export class TelegramOrderNotifier implements OrderNotifier {
  constructor(
    @Inject(TELEGRAM_NOTIFIER) private readonly notifier: TelegramNotifier,
  ) {}

  async notifyNewOrder(order: Order, createdByAdmin: boolean): Promise<void> {
    const items = order.items
      .map(
        (item) =>
          `• ${escapeHtml(item.productName)} x ${String(item.quantity)}`,
      )
      .join("\n");
    const source = createdByAdmin ? "📱 <i>(Created by admin)</i>\n" : "";
    const method =
      order.deliveryMethod === DELIVERY_METHOD.PICKUP ? "Pickup" : "Delivery";

    await this.notifier.sendMessage(
      `🛍️ <b>New order (ID: ${String(order.id)})!</b>\n` +
        `${source}\n` +
        `👤 <b>Instagram:</b> @${escapeHtml(order.customerInstagram)}\n` +
        `🗓️ <b>Delivery date:</b> ${localDate(order.deliveryDate)}\n` +
        `📦 <b>Method:</b> ${method}\n` +
        `📋 <b>Items:</b>\n${items}\n` +
        `💰 <b>Total:</b> ${money(order.totalAmount)}\n` +
        `💳 <b>Paid:</b> ${money(order.amountPaid)}`,
    );
  }
}
