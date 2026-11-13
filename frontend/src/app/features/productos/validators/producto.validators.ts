import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { esFechaIsoValida, hoyIso, sumarUnAnio } from '../../../shared/utils/fecha.util';

/** Rechaza valores compuestos solo de espacios. */
export function noSoloEspacios(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const valor: unknown = control.value;
        if (typeof valor !== 'string' || valor.length === 0) {
            return null;
        }
        return valor.trim().length > 0 ? null : { soloEspacios: true };
    };
}

/** La fecha debe ser igual o posterior a hoy. */
export function fechaNoAnteriorAHoy(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const valor: unknown = control.value;
        if (!valor) {
            return null; // La obligatoriedad es de Validators.required.
        }
        if (!esFechaIsoValida(valor)) {
            return { fechaInvalida: true };
        }
        return valor >= hoyIso() ? null : { fechaAnteriorAHoy: true };
    };
}

/** Validador de grupo: la revisión debe ser un año posterior a la liberación. */
export function revisionUnAnioDespues(
    nombreLiberacion: string,
    nombreRevision: string
): ValidatorFn {
    return (grupo: AbstractControl): ValidationErrors | null => {
        const liberacion: unknown = grupo.get(nombreLiberacion)?.value;
        const revision: unknown = grupo.get(nombreRevision)?.value;

        if (!esFechaIsoValida(liberacion) || !esFechaIsoValida(revision)) {
            return null; // Cada control reporta su propio formato inválido.
        }
        return revision === sumarUnAnio(liberacion)
            ? null
            : { revisionNoEsUnAnioDespues: true };
    };
}
