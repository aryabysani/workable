import { Badge } from "@/components/ui";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

const tone: Record<OrderStatus, "accent" | "clay" | "danger" | "neutral"> = {
  pending: "clay",
  accepted: "accent",
  fulfilled: "accent",
  declined: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={tone[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}
