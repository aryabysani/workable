"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui";
import { OrderStatusBadge } from "@/components/merch/OrderStatusBadge";
import { setOrderStatusAction } from "@/app/school/merch/actions";
import { formatINR } from "@/lib/format";
import type { MerchOrder, OrderStatus } from "@/lib/types";

type Row = MerchOrder & {
  productName: string;
  buyerName: string;
};

export function SchoolOrderCard({ order }: { order: Row }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const router = useRouter();

  function update(status: OrderStatus) {
    startTransition(async () => {
      const res = await setOrderStatusAction(order.id, status);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="bg-surface border border-border rounded-[20px] p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <h3 className="font-serif font-semibold text-lg text-foreground">{order.productName}</h3>
          <p className="text-sm text-muted">From {order.buyerName}</p>
        </div>
        <div className="ml-auto"><OrderStatusBadge status={order.status} /></div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div><span className="text-muted block">Quantity</span><span className="font-semibold">{order.quantity}</span></div>
        <div><span className="text-muted block">Unit</span><span className="font-semibold">{formatINR(order.unit_price)}</span></div>
        <div><span className="text-muted block">Total</span><span className="font-semibold text-accent">{formatINR(order.total_price)}</span></div>
      </div>

      {order.delivery_details && (
        <p className="text-sm text-foreground"><span className="text-muted">Delivery: </span>{order.delivery_details}</p>
      )}
      {order.notes && (
        <p className="text-sm text-foreground"><span className="text-muted">Notes: </span>{order.notes}</p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-2 mt-auto pt-2">
        {order.status === "pending" && (
          <>
            <button disabled={pending} onClick={() => update("accepted")} className={buttonClass("primary")}>Accept</button>
            <button disabled={pending} onClick={() => update("declined")} className={buttonClass("danger")}>Decline</button>
          </>
        )}
        {order.status === "accepted" && (
          <button disabled={pending} onClick={() => update("fulfilled")} className={buttonClass("primary")}>Mark fulfilled</button>
        )}
        {(order.status === "declined" || order.status === "fulfilled") && (
          <span className="text-sm text-muted">No further action needed.</span>
        )}
      </div>
    </div>
  );
}
