import { BadRequestError, NotFoundError } from "routing-controllers";
import { MESSAGE_ERROR } from "../const/message-error.const";
import { ProductChanges, ProductInterface } from "../interfaces/product.interface";
import { productRepository } from "../repositories/in-memory-product.repository";
import { ProductRepository } from "../repositories/product.repository";

/** Reglas de negocio de productos. */
export class ProductService {
  constructor(private readonly repository: ProductRepository = productRepository) {}

  listar(): ProductInterface[] {
    return this.repository.findAll();
  }

  obtener(id: string): ProductInterface {
    const product = this.repository.findById(id);
    if (!product) {
      throw new NotFoundError(MESSAGE_ERROR.NotFound);
    }
    return product;
  }

  existe(id: string): boolean {
    return this.repository.exists(id);
  }

  crear(product: ProductInterface): ProductInterface {
    if (this.repository.exists(product.id)) {
      throw new BadRequestError(MESSAGE_ERROR.DuplicateIdentifier);
    }
    return this.repository.create(product);
  }

  actualizar(id: string, changes: ProductChanges): ProductInterface {
    if (!this.repository.exists(id)) {
      throw new NotFoundError(MESSAGE_ERROR.NotFound);
    }
    return this.repository.update(id, changes);
  }

  eliminar(id: string): void {
    if (!this.repository.exists(id)) {
      throw new NotFoundError(MESSAGE_ERROR.NotFound);
    }
    this.repository.remove(id);
  }
}

/** Instancia por defecto que usa el controlador. */
export const productService = new ProductService();
