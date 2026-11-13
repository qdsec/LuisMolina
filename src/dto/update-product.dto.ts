import { IsNotEmpty, IsString, Length, Matches, MaxLength } from "class-validator";
import { ProductChanges } from "../interfaces/product.interface";
import { EsFechaNoAnteriorAHoy, EsUnAnioDespuesDe } from "../validators/fecha.validators";

/** Cuerpo de la actualización. El id viaja en la URL y no se puede cambiar. */
export class UpdateProductDTO implements ProductChanges {
  // Exige al menos un carácter visible.
  @IsString()
  @Length(5, 100)
  @Matches(/\S/, { message: "name no puede contener solo espacios" })
  name!: string;

  @IsString()
  @Length(10, 200)
  @Matches(/\S/, { message: "description no puede contener solo espacios" })
  description!: string;

  // Tope para no almacenar cadenas enormes.
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  logo!: string;

  @EsFechaNoAnteriorAHoy()
  date_release!: string;

  @EsUnAnioDespuesDe("date_release")
  date_revision!: string;
}
