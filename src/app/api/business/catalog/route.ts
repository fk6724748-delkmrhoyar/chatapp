import { NextResponse } from "next/server";
import { db } from "@/db";
import { catalogProducts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, product_id, user_id, name, price, description, image_url, collection, is_available } = body;

    if (!action || !user_id) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "action and user_id required." } }, { status: 400 });
    }

    if (action === "add") {
      if (!name || !price) {
        return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Product name and price required." } }, { status: 400 });
      }

      const newProd = {
        id: `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        user_id,
        name,
        price: Number(price),
        description: description || "",
        image_url: image_url || null,
        collection: collection || "General",
        is_available: is_available !== undefined ? Boolean(is_available) : true,
        created_at: new Date(),
      };

      await db.insert(catalogProducts).values(newProd);

      return NextResponse.json({ success: true, data: { product: newProd } });
    } else if (action === "edit" && product_id) {
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (price !== undefined) updateData.price = Number(price);
      if (description !== undefined) updateData.description = description;
      if (image_url !== undefined) updateData.image_url = image_url;
      if (collection !== undefined) updateData.collection = collection;
      if (is_available !== undefined) updateData.is_available = Boolean(is_available);

      await db.update(catalogProducts).set(updateData).where(eq(catalogProducts.id, product_id));

      const updated = (await db.select().from(catalogProducts).where(eq(catalogProducts.id, product_id)).limit(1))[0];
      return NextResponse.json({ success: true, data: { product: updated } });
    } else if (action === "delete" && product_id) {
      await db.delete(catalogProducts).where(eq(catalogProducts.id, product_id));
      return NextResponse.json({ success: true, data: { deleted_id: product_id } });
    }

    return NextResponse.json({ success: false, error: { code: "INVALID_ACTION", message: "Invalid catalog action." } }, { status: 400 });
  } catch (error: any) {
    console.error("Catalog management error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: error.message } }, { status: 500 });
  }
}
