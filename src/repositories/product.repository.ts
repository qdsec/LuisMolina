import { ProductChanges, ProductInterface } from "../interfaces/product.interface";

/** Contrato de almacenamiento de productos. */
export interface ProductRepository {
  findAll(): ProductInterface[];
  findById(id: string): ProductInterface | undefined;
  exists(id: string): boolean;
  create(product: ProductInterface): ProductInterface;
  update(id: string, changes: ProductChanges): ProductInterface;
  remove(id: string): void;
}
