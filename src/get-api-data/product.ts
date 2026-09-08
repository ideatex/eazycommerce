import { prisma } from "@/lib/prismaDB";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { mockProducts } from "@/data/mockProducts";
import { Product } from "@/types/product";

// get product for id and title 
export const getProductsIdAndTitle = unstable_cache(
  async () => {
    try {
      const items = await prisma.product.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
        },
      });
      if (items && items.length > 0) return items;
      return mockProducts.map((p) => ({ id: p.id, title: p.title }));
    } catch {
      return mockProducts.map((p) => ({ id: p.id, title: p.title }));
    }
  },
  ['products'], { tags: ['products'] }
);

// get new arrival product
export const getNewArrivalsProduct = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      const products = await prisma.product.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          shortDescription: true,
          price: true,
          discountedPrice: true,
          slug: true,
          quantity: true,
          updatedAt: true,
          productVariants: {
            select: {
              image: true,
              color: true,
              size: true,
              isDefault: true
            }
          },
          _count: {
            select: {
              reviews: {
                where:{
                  isApproved: true
                }
              },
            }
          }
        },
        take: 8
      });
      if (products && products.length > 0) {
        return products.map(({ _count, ...item }) => ({
          ...item,
          reviews: _count.reviews,
          price: item.price.toNumber(),
          discountedPrice: item?.discountedPrice ? item.discountedPrice.toNumber() : null
        }));
      }
      return mockProducts.slice(0, 8) as any;
    } catch {
      return mockProducts.slice(0, 8) as any;
    }
  },
  ['products'], { tags: ['products'] }
);

// get best selling product
export const getBestSellingProducts = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          title: true,
          shortDescription: true,
          price: true,
          discountedPrice: true,
          slug: true,
          quantity: true,
          updatedAt: true,
          productVariants: {
            select: {
              image: true,
              color: true,
              size: true,
              isDefault: true
            }
          },
          _count: {
            select: {
              reviews: {
                where: {
                  isApproved: true
                }
              }
            }
          }
        },
        orderBy: {
          reviews: {
            _count: "desc",
          },
        },
        take: 6
      });
      if (products && products.length > 0) {
        return products.map(({ _count, ...item }) => ({
          ...item,
          reviews: _count.reviews,
          price: item.price.toNumber(),
          discountedPrice: item?.discountedPrice ? item.discountedPrice.toNumber() : null
        }));
      }
      return mockProducts.slice(0, 6) as any;
    } catch {
      return mockProducts.slice(0, 6) as any;
    }
  },
  ['products'], { tags: ['products'] }
);

// get latest product
export const getLatestProducts = unstable_cache(
  async () => {
    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          title: true,
          shortDescription: true,
          price: true,
          discountedPrice: true,
          slug: true,
          quantity: true,
          updatedAt: true,
          productVariants: {
            select: {
              image: true,
              color: true,
              size: true,
              isDefault: true
            }
          },
          _count: {
            select: {
              reviews: {
                where: {
                  isApproved: true
                }
              }
            }
          }
        },
        orderBy: [
          { reviews: { _count: "desc" } },
          { updatedAt: "desc" },
        ],
        take: 3
      });
      if (products && products.length > 0) {
        return products.map(({ _count, ...item }) => ({
          ...item,
          reviews: _count.reviews,
          price: item.price.toNumber(),
          discountedPrice: item?.discountedPrice ? item.discountedPrice.toNumber() : null
        }));
      }
      return mockProducts.slice(0, 3) as any;
    } catch {
      return mockProducts.slice(0, 3) as any;
    }
  },
  ['products'], { tags: ['products'] }
);


// GET ALL PRODUCTS
export const getAllProducts = unstable_cache(
  async (
    orderBy: { updatedAt?: Prisma.SortOrder } | { reviews: { _count: Prisma.SortOrder } } = { updatedAt: 'desc' }
  ) => {
    try {
      const products = await prisma.product.findMany({
        orderBy,
        select: {
          id: true,
          title: true,
          shortDescription: true,
          price: true,
          discountedPrice: true,
          slug: true,
          quantity: true,
          updatedAt: true,
          productVariants: {
            select: {
              image: true,
              color: true,
              size: true,
              isDefault: true
            }
          },
          _count: {
            select: {
              reviews: {
                where: {
                  isApproved: true
                }
              }
            }
          }
        },
      });
      if (products && products.length > 0) {
        return products.map(({ _count, ...item }) => ({
          ...item,
          reviews: _count.reviews,
          price: item.price.toNumber(),
          discountedPrice: item?.discountedPrice ? item.discountedPrice.toNumber() : null
        }));
      }
      return mockProducts as any;
    } catch {
      return mockProducts as any;
    }
  },
  ['products'], { tags: ['products'] }
);

// GET PRODUCT BY SLUG
export const getProductBySlug = async (slug: string) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        description: true,
        price: true,
        discountedPrice: true,
        slug: true,
        quantity: true,
        updatedAt: true,
        category: {
          select: {
            title: true,
            slug: true,
          },
        },
        productVariants: {
          select: {
            image: true,
            color: true,
            size: true,
            isDefault: true
          }
        },
        _count: {
          select: {
            reviews: {
              where: {
                isApproved: true
              }
            }
          }
        },
        additionalInformation: {
          select: {
            name: true,
            description: true
          }
        },
        customAttributes: {
          select: {
            attributeName: true,
            attributeValues: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        body: true,
        reviews: {
          select: {
            name: true,
            comment: true,
            email: true,
            ratings: true
          }
        },
        tags: true,
        offers: true,
        sku: true,
      },
    });
    if (!product) {
      const mock = mockProducts.find((p) => p.slug === slug);
      if (mock) {
        return {
          ...mock,
          additionalInformation: mock.additionalInfo,
          customAttributes: [],
          body: mock.description,
          offers: "Limited Time 20% Off",
          reviews: [],
        } as any;
      }
      return null;
    }
    const transformProduct = {
      ...product,
      price: product?.price.toNumber(),
      discountedPrice: product?.discountedPrice ? product.discountedPrice.toNumber() : null,
      reviews: product?._count.reviews,
    };
    return transformProduct;
  } catch {
    const mock = mockProducts.find((p) => p.slug === slug);
    if (mock) {
      return {
        ...mock,
        additionalInformation: mock.additionalInfo,
        customAttributes: [],
        body: mock.description,
        offers: "Limited Time 20% Off",
        reviews: [],
      } as any;
    }
    return null;
  }
};

// GET PRODUCT BY ID
export const getProductById = async (productId: string) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        productVariants: true,
        additionalInformation: {
          select: {
            name: true,
            description: true,
          },
        },
        customAttributes: {
          select: {
            attributeName: true,
            attributeValues: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
    if (!product) {
      return (mockProducts.find((p) => p.id === productId) as any) || null;
    }
    const transformProduct = {
      ...product,
      price: product?.price.toNumber(),
      discountedPrice: product?.discountedPrice ? product.discountedPrice.toNumber() : null
    };
    return transformProduct;
  } catch {
    return (mockProducts.find((p) => p.id === productId) as any) || null;
  }
};

export const getRelatedProducts = unstable_cache(
  async (category: string, tags: string[] | undefined, currentProductId: string, productTitle: string) => {
    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          title: true,
          shortDescription: true,
          price: true,
          discountedPrice: true,
          slug: true,
          quantity: true,
          updatedAt: true,
          productVariants: {
            select: {
              image: true,
              color: true,
              size: true,
              isDefault: true
            }
          },
          _count: {
            select: {
              reviews: {
                where: {
                  isApproved: true
                }
              }
            }
          }
        },
        where: {
          AND: [
            { id: { not: currentProductId } },
            {
              OR: [
                { category: { slug: category } },
                { title: { contains: productTitle } }
              ]
            }
          ]
        },
        take: 4
      });
      if (products && products.length > 0) {
        return products.map(({ _count, ...item }) => ({
          ...item,
          reviews: _count.reviews,
          price: item.price.toNumber(),
          discountedPrice: item?.discountedPrice ? item.discountedPrice.toNumber() : null
        }));
      }
      return mockProducts.filter((p) => p.id !== currentProductId).slice(0, 4) as any;
    } catch {
      return mockProducts.filter((p) => p.id !== currentProductId).slice(0, 4) as any;
    }
  },
  ['products'], { tags: ['products'] }
);
