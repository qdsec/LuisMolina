import { FormControl, FormGroup } from '@angular/forms';
import { hoyIso, sumarUnAnio } from '../../../shared/utils/fecha.util';
import {
    fechaNoAnteriorAHoy,
    noSoloEspacios,
    revisionUnAnioDespues,
} from './producto.validators';

describe('noSoloEspacios', () => {
    const validar = noSoloEspacios();

    it('acepta un texto con contenido', () => {
        expect(validar(new FormControl('Tarjetas'))).toBeNull();
        expect(validar(new FormControl('  Tarjetas  '))).toBeNull();
    });

    it('rechaza un texto de solo espacios', () => {
        expect(validar(new FormControl('     '))).toEqual({ soloEspacios: true });
    });

    it('deja el vacío a Validators.required', () => {
        expect(validar(new FormControl(''))).toBeNull();
        expect(validar(new FormControl(null))).toBeNull();
    });
});

describe('fechaNoAnteriorAHoy', () => {
    const validar = fechaNoAnteriorAHoy();

    it('acepta la fecha de hoy', () => {
        expect(validar(new FormControl(hoyIso()))).toBeNull();
    });

    it('acepta una fecha futura', () => {
        expect(validar(new FormControl('2099-01-01'))).toBeNull();
    });

    it('rechaza una fecha pasada', () => {
        expect(validar(new FormControl('2020-01-01'))).toEqual({ fechaAnteriorAHoy: true });
    });

    it('rechaza un formato inválido', () => {
        expect(validar(new FormControl('01/01/2030'))).toEqual({ fechaInvalida: true });
    });

    it('rechaza un día inexistente', () => {
        expect(validar(new FormControl('2027-02-29'))).toEqual({ fechaInvalida: true });
    });

    it('deja pasar el vacío, que es asunto de required', () => {
        expect(validar(new FormControl(''))).toBeNull();
    });
});

describe('revisionUnAnioDespues', () => {
    const validar = revisionUnAnioDespues('fechaLiberacion', 'fechaRevision');

    function grupo(liberacion: string, revision: string): FormGroup {
        return new FormGroup({
            fechaLiberacion: new FormControl(liberacion),
            fechaRevision: new FormControl(revision),
        });
    }

    it('acepta exactamente un año después', () => {
        expect(validar(grupo('2027-03-15', '2028-03-15'))).toBeNull();
    });

    it('acepta el 29 de febrero contra el 28 del año siguiente', () => {
        expect(validar(grupo('2028-02-29', '2029-02-28'))).toBeNull();
        expect(sumarUnAnio('2028-02-29')).toBe('2029-02-28');
    });

    it('rechaza una diferencia distinta de un año', () => {
        expect(validar(grupo('2027-03-15', '2027-09-15'))).toEqual({
            revisionNoEsUnAnioDespues: true,
        });
    });

    it('rechaza el 1 de marzo como sucesor del 29 de febrero', () => {
        expect(validar(grupo('2028-02-29', '2029-03-01'))).toEqual({
            revisionNoEsUnAnioDespues: true,
        });
    });

    it('no opina si alguna fecha aún no es válida', () => {
        expect(validar(grupo('', ''))).toBeNull();
        expect(validar(grupo('2027-03-15', 'xx'))).toBeNull();
    });
});
