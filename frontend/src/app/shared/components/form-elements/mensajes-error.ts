import { ValidationErrors } from '@angular/forms';

/** Traduce el primer error de un control a un texto para la persona. */
export function primerMensajeDeError(
    errores: ValidationErrors | null,
    etiqueta: string
): string | null {
    if (!errores) {
        return null;
    }

    // El mensaje del backend tiene prioridad.
    if (typeof errores['backend'] === 'string') {
        return errores['backend'];
    }
    if (errores['required']) {
        return 'Este campo es requerido!';
    }
    if (errores['soloEspacios']) {
        return 'Este campo no puede contener solo espacios';
    }
    if (errores['minlength']) {
        const requerido = errores['minlength'].requiredLength as number;
        return `${etiqueta} debe tener al menos ${requerido} caracteres`;
    }
    if (errores['maxlength']) {
        const permitido = errores['maxlength'].requiredLength as number;
        return `${etiqueta} no puede superar ${permitido} caracteres`;
    }
    if (errores['idRegistrado']) {
        return 'ID no válido!';
    }
    if (errores['fechaInvalida']) {
        return 'Ingresa una fecha válida';
    }
    if (errores['fechaAnteriorAHoy']) {
        return 'La fecha debe ser igual o mayor a la fecha actual';
    }
    if (errores['revisionNoEsUnAnioDespues']) {
        return 'La fecha debe ser exactamente un año posterior a la liberación';
    }

    return 'El valor ingresado no es válido';
}
