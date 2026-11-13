import "reflect-metadata";
import {
  BadRequestError,
  Body,
  Delete,
  Get,
  JsonController,
  Param,
  Post,
  Put,
} from "routing-controllers";
import { MESSAGE_ERROR, MESSAGE_SUCCESS } from "../const/message-error.const";
import { CreateProductDTO } from "../dto/create-product.dto";
import { UpdateProductDTO } from "../dto/update-product.dto";
import { ProductInterface } from "../interfaces/product.interface";
import { ProductService, productService } from "../services/product.service";

/** Capa HTTP: recibe, delega en el servicio y arma la respuesta. */
@JsonController("/products")
export class ProductController {
  // El valor por defecto es necesario: routing-controllers instancia sin argumentos.
  constructor(private readonly service: ProductService = productService) {}

  @Get("")
  getAll(): { data: ProductInterface[] } {
    return { data: this.service.listar() };
  }

  @Get("/verification/:id")
  verifyIdentifier(@Param("id") id: string): boolean {
    return this.service.existe(id);
  }

  @Get("/:id")
  getOne(@Param("id") id: string): ProductInterface {
    return this.service.obtener(id);
  }

  @Post("")
  createItem(@Body({ validate: true }) product: CreateProductDTO): {
    message: string;
    data: ProductInterface;
  } {
    // Un arreglo elude la validación y guardaría un registro sin id.
    exigirObjeto(product);

    return {
      message: MESSAGE_SUCCESS.Added,
      data: this.service.crear(product),
    };
  }

  @Put("/:id")
  put(
    @Param("id") id: string,
    @Body({ validate: true }) changes: UpdateProductDTO
  ): { message: string; data: ProductInterface } {
    exigirObjeto(changes);

    return {
      message: MESSAGE_SUCCESS.Updated,
      data: this.service.actualizar(id, changes),
    };
  }

  @Delete("/:id")
  remove(@Param("id") id: string): { message: string } {
    this.service.eliminar(id);
    return { message: MESSAGE_SUCCESS.Removed };
  }
}

/** Exige que el cuerpo sea un objeto: class-validator deja pasar los arreglos. */
function exigirObjeto(cuerpo: unknown): void {
  if (Array.isArray(cuerpo) || typeof cuerpo !== "object" || cuerpo === null) {
    throw new BadRequestError(MESSAGE_ERROR.InvalidBody);
  }
}
