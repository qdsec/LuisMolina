import { ProductChanges, ProductInterface } from "../interfaces/product.interface";
import { PRODUCTS_SEED } from "../seed/products.seed";
import { ProductRepository } from "./product.repository";

/** Almacenamiento en memoria. Copia al entrar y al salir: nadie muta el estado por referencia. */
export class InMemoryProductRepository implements ProductRepository {
  private products: ProductInterface[];

  constructor(initial: ProductInterface[] = []) {
    this.products = initial.map((product) => ({ ...product }));
  }

  findAll(): ProductInterface[] {
    return this.products.map((product) => ({ ...product }));
  }

  findById(id: string): ProductInterface | undefined {
    const found = this.products.find((product) => product.id === id);
    return found ? { ...found } : undefined;
  }

  exists(id: string): boolean {
    return this.products.some((product) => product.id === id);
  }

  create(product: ProductInterface): ProductInterface {
    this.products.push({ ...product });
    return { ...product };
  }

  update(id: string, changes: ProductChanges): ProductInterface {
    const index = this.products.findIndex((product) => product.id === id);
    // Red de seguridad: el servicio ya verificó la existencia.
    if (index === -1) {
      throw new Error(`No existe el producto ${id}`);
    }
    const updated: ProductInterface = { ...this.products[index], ...changes, id };
    this.products[index] = updated;
    return { ...updated };
  }

  remove(id: string): void {
    this.products = this.products.filter((product) => product.id !== id);
  }

  /** Solo para pruebas: restablece el contenido del repositorio. */
  reset(initial: ProductInterface[] = []): void {
    this.products = initial.map((product) => ({ ...product }));
  }
}

/**
 * Instancia única del proceso. Al ser un módulo de Node, se evalúa una sola vez,
 * así que el estado se comparte entre todas las peticiones.
 */
export const productRepository = new InMemoryProductRepository(PRODUCTS_SEED);
