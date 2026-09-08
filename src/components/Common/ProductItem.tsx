"use client";

import React from "react";
import ProductCard from "./ProductCard";
import { Product } from "@/types/product";

type Props = {
  bgClr?: string;
  item: Product;
  sellerName?: string;
  className?: string;
};

const ProductItem: React.FC<Props> = ({ item, sellerName, className = "" }) => {
  return <ProductCard product={item} sellerName={sellerName} className={className} />;
};

export default ProductItem;
