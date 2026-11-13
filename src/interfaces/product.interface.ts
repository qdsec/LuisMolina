export interface ProductInterface {
  id: string;
  name: string;
  description: string;
  logo: string;
  /** Fecha en formato `YYYY-MM-DD`. */
  date_release: string;
  date_revision: string;
}

/** Campos modificables: todo menos el identificador. */
export type ProductChanges = Omit<ProductInterface, "id">;
