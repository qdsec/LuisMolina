/* eslint-disable @typescript-eslint/naming-convention */
// DTOs del backend: snake_case, no salen de api/ ni de los mappers.

export interface ProductoDto {
    id: string;
    name: string;
    description: string;
    logo: string;
    date_release: string;
    date_revision: string;
}

/** Cuerpo del alta: incluye el id. */
export type CrearProductoRequestDto = ProductoDto;

/** Cuerpo de la edición: el id viaja en la URL y no se envía. */
export type ActualizarProductoRequestDto = Omit<ProductoDto, 'id'>;

export interface ListaProductosDto {
    data: ProductoDto[];
}

export interface MutacionProductoDto {
    message: string;
    data: ProductoDto;
}

export interface EliminacionProductoDto {
    message: string;
}
