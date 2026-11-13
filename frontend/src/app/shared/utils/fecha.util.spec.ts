import { aFechaLocal, diasDelMes, esFechaIsoValida, hoyIso, sumarUnAnio } from './fecha.util';

describe('fecha.util', () => {
    describe('esFechaIsoValida', () => {
        it('acepta fechas YYYY-MM-DD reales', () => {
            expect(esFechaIsoValida('2027-01-01')).toBe(true);
            expect(esFechaIsoValida('2028-02-29')).toBe(true);
        });

        it('rechaza días que no existen en ese mes', () => {
            expect(esFechaIsoValida('2027-02-29')).toBe(false);
            expect(esFechaIsoValida('2027-04-31')).toBe(false);
        });

        it('rechaza otros formatos y valores que no son cadenas', () => {
            expect(esFechaIsoValida('01/01/2027')).toBe(false);
            expect(esFechaIsoValida('2027-1-1')).toBe(false);
            expect(esFechaIsoValida(null)).toBe(false);
            expect(esFechaIsoValida(new Date())).toBe(false);
        });
    });

    describe('sumarUnAnio', () => {
        it('mantiene día y mes en un año normal', () => {
            expect(sumarUnAnio('2027-03-15')).toBe('2028-03-15');
        });

        it('recorta el 29 de febrero al 28 del año siguiente', () => {
            expect(sumarUnAnio('2028-02-29')).toBe('2029-02-28');
        });

        it('conserva el 31 de diciembre', () => {
            expect(sumarUnAnio('2027-12-31')).toBe('2028-12-31');
        });
    });

    describe('diasDelMes', () => {
        it('distingue los febreros bisiestos', () => {
            expect(diasDelMes(2028, 2)).toBe(29);
            expect(diasDelMes(2029, 2)).toBe(28);
        });
    });

    describe('hoyIso', () => {
        it('devuelve la fecha local, no la UTC', () => {
            const ahora = new Date();
            const esperado = [
                String(ahora.getFullYear()).padStart(4, '0'),
                String(ahora.getMonth() + 1).padStart(2, '0'),
                String(ahora.getDate()).padStart(2, '0'),
            ].join('-');
            expect(hoyIso()).toBe(esperado);
        });
    });

    describe('aFechaLocal', () => {
        it('no corre el día por zona horaria', () => {
            const fecha = aFechaLocal('2027-03-01');
            expect(fecha.getFullYear()).toBe(2027);
            expect(fecha.getMonth()).toBe(2);
            expect(fecha.getDate()).toBe(1);
        });
    });
});
