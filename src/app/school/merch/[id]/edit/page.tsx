import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { ProductForm } from "@/components/merch/ProductForm";
import { updateProductAction } from "@/app/school/merch/actions";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await requireRole("school");
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products").select("*").eq("id", id).eq("school_id", userId).single();
  if (!product) notFound();

  const action = updateProductAction.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="font-serif text-3xl font-semibold text-foreground">Edit {(product as Product).name}</h1>
      <Card>
        <ProductForm action={action} product={product as Product} />
      </Card>
    </div>
  );
}
