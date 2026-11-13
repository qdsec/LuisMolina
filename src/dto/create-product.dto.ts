import { IsString, Length, Matches } from "class-validator";
import { ProductInterface } from "../interfaces/product.interface";
import { UpdateProductDTO } from "./update-product.dto";

/** Cuerpo del alta: los campos de la edición más el id. */
export class CreateProductDTO extends UpdateProductDTO implements ProductInterface {
  @IsString()
  @Length(3, 10)
  @Matches(/^\S+$/, { message: "id no puede contener espacios" })
  id!: string;
}
