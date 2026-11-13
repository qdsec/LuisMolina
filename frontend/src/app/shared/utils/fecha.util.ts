// Las fechas se manejan como cadenas `YYYY-MM-DD`: `new Date('2027-03-01')` se interpreta en UTC.
const FORMATO_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Valida el formato `YYYY-MM-DD` y que el día exista. */
export function esFechaIsoValida(valor: unknown): valor is string {
    if (typeof valor !== 'string' || !FORMATO_ISO.test(valor)) {
        return false;
    }
    const [anio, mes, dia] = valor.split('-').map(Number);
    if (mes < 1 || mes > 12) {
        return false;
    }
    return dia >= 1 && dia <= diasDelMes(anio, mes);
}

export function diasDelMes(anio: number, mes: number): number {
    return new Date(anio, mes, 0).getDate();
}

/** Fecha de hoy en hora local, como `YYYY-MM-DD`. */
export function hoyIso(): string {
    const ahora = new Date();
    return aIso(ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate());
}

/** Suma un año: mismo día y mes, recortando el 29 de febrero al 28. */
export function sumarUnAnio(fechaIso: string): string {
    const [anio, mes, dia] = fechaIso.split('-').map(Number);
    const anioDestino = anio + 1;
    return aIso(anioDestino, mes, Math.min(dia, diasDelMes(anioDestino, mes)));
}

/** Convierte a `Date` local, solo para mostrar. */
export function aFechaLocal(fechaIso: string): Date {
    const [anio, mes, dia] = fechaIso.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
}

function aIso(anio: number, mes: number, dia: number): string {
    return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}
