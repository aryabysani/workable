import { Card } from "@/components/ui";
import { ProductForm } from "@/components/merch/ProductForm";
import { createProductAction } from "@/app/school/merch/actions";
import { requireRole } from "@/lib/auth";

export default async function NewProductPage() {
  await requireRole("school");
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="font-serif text-3xl font-semibold text-foreground">Add a product</h1>
      <Card>
        <ProductForm action={createProductAction} />
      </Card>
    </div>
  );
}
