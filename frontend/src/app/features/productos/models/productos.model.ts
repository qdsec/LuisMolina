/** Producto financiero tal como lo ve la interfaz. */
export interface Producto {
    id: string;
    nombre: string;
    descripcion: string;
    logo: string;
    fechaLiberacion: string;
    fechaRevision: string;
}

/** Datos de un producto nuevo: el id lo define el usuario. */
export type ProductoNuevo = Producto;

/** Campos modificables de un producto existente. */
export type CambiosProducto = Omit<Producto, 'id'>;

/** Cantidad de registros por página que ofrece el listado. */
export const TAMANOS_PAGINA = [5, 10, 20] as const;

export type TamanoPagina = (typeof TAMANOS_PAGINA)[number];
