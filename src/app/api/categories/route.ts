import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaDB";
import { AuthEngine, ApiError } from "@/lib/auth";
import { handle, ok, readJson, reqStr, str, num, slugify } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { revalidateStorefront } from "@/lib/revalidate";

/** Public: active categories for storefront navigation. */
export async function GET() {
  return handle(async () => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, imageUrl: true, parentId: true, sortOrder: true },
    });
    return ok(categories);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("categories");
    const body = await readJson(req);

    const name = reqStr(body.name, "Category name", 120);
    const slug = slugify(str(body.slug) || name);
    if (!slug) throw new ApiError(400, "VALIDATION", "A valid slug could not be derived.");

    const parentId = str(body.parentId) || null;
    if (parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: parentId, businessId: user.businessId },
        select: { id: true, parentId: true },
      });
      if (!parent) throw new ApiError(400, "VALIDATION", "Parent category not found.");
      if (parent.parentId) {
        throw new ApiError(400, "VALIDATION", "Categories can be nested one level deep only.");
      }
    }

    const category = await prisma.category.create({
      data: {
        businessId: user.businessId,
        name,
        slug,
        description: str(body.description) || null,
        imageUrl: str(body.imageUrl) || null,
        parentId,
        sortOrder: body.sortOrder === undefined ? 0 : num(body.sortOrder, "Sort order", { int: true, min: 0, max: 9999 }),
      },
    });

    await writeAudit({ businessId: user.businessId, userId: user.id, action: "CATEGORY_CREATED", entity: "Category", entityId: category.id, details: { name, slug } });
    revalidateStorefront();
    return ok(category, 201);
  });
}

export async function PUT(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("categories");
    const body = await readJson(req);
    const id = reqStr(body.id, "Category id", 64);

    const existing = await prisma.category.findFirst({ where: { id, businessId: user.businessId } });
    if (!existing) throw new ApiError(404, "NOT_FOUND", "Category not found.");

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = reqStr(body.name, "Category name", 120);
    if (body.description !== undefined) data.description = str(body.description) || null;
    if (body.imageUrl !== undefined) data.imageUrl = str(body.imageUrl) || null;
    if (body.sortOrder !== undefined) data.sortOrder = num(body.sortOrder, "Sort order", { int: true, min: 0, max: 9999 });
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") throw new ApiError(400, "VALIDATION", "isActive must be true or false.");
      data.isActive = body.isActive;
    }

    const updated = await prisma.category.update({ where: { id }, data });
    await writeAudit({ businessId: user.businessId, userId: user.id, action: "CATEGORY_UPDATED", entity: "Category", entityId: id, details: data });
    revalidateStorefront();
    return ok(updated);
  });
}

export async function DELETE(req: NextRequest) {
  return handle(async () => {
    const user = await AuthEngine.requireAdmin("categories");
    const id = reqStr(req.nextUrl.searchParams.get("id"), "Category id", 64);

    const category = await prisma.category.findFirst({
      where: { id, businessId: user.businessId },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!category) throw new ApiError(404, "NOT_FOUND", "Category not found.");
    if (category._count.products > 0) {
      throw new ApiError(409, "IN_USE", `Category has ${category._count.products} product(s). Move or archive them first.`);
    }
    if (category._count.children > 0) {
      throw new ApiError(409, "IN_USE", "Category has subcategories. Delete or move them first.");
    }

    await prisma.category.delete({ where: { id } });
    await writeAudit({ businessId: user.businessId, userId: user.id, action: "CATEGORY_DELETED", entity: "Category", entityId: id, details: { name: category.name } });
    revalidateStorefront();
    return ok({ id });
  });
}
