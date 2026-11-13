import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { esFechaIsoValida, hoyIso, sumarUnAnio } from "../utils/fecha.util";

/** La fecha debe ser igual o posterior a hoy. */
@ValidatorConstraint({ name: "esFechaNoAnteriorAHoy", async: false })
class EsFechaNoAnteriorAHoyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return esFechaIsoValida(value) && value >= hoyIso();
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} debe ser una fecha YYYY-MM-DD igual o posterior a hoy`;
  }
}

export function EsFechaNoAnteriorAHoy(options?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      validator: EsFechaNoAnteriorAHoyConstraint,
    });
  };
}

/**
 * La fecha debe ser exactamente un año posterior a la propiedad indicada.
 *
 * Usa la misma función `sumarUnAnio` que el resto del sistema, de modo que el
 * 29 de febrero se compara contra el 28 de febrero del año siguiente.
 */
@ValidatorConstraint({ name: "esUnAnioDespuesDe", async: false })
class EsUnAnioDespuesDeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [propiedadBase] = args.constraints as [string];
    const base = (args.object as Record<string, unknown>)[propiedadBase];
    if (!esFechaIsoValida(value) || !esFechaIsoValida(base)) {
      return false;
    }
    return value === sumarUnAnio(base);
  }

  defaultMessage(args: ValidationArguments): string {
    const [propiedadBase] = args.constraints as [string];
    return `${args.property} debe ser exactamente un año posterior a ${propiedadBase}`;
  }
}

export function EsUnAnioDespuesDe(propiedadBase: string, options?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [propiedadBase],
      validator: EsUnAnioDespuesDeConstraint,
    });
  };
}
