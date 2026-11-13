import { diasDelMes, esFechaIsoValida, hoyIso, sumarUnAnio } from "./fecha.util";

describe("fecha.util", () => {
  describe("esFechaIsoValida", () => {
    it("acepta una fecha YYYY-MM-DD real", () => {
      expect(esFechaIsoValida("2027-01-01")).toBe(true);
      expect(esFechaIsoValida("2028-02-29")).toBe(true);
    });

    it("rechaza un día que no existe en ese mes", () => {
      expect(esFechaIsoValida("2027-02-29")).toBe(false);
      expect(esFechaIsoValida("2027-04-31")).toBe(false);
    });

    it("rechaza meses fuera de rango", () => {
      expect(esFechaIsoValida("2027-13-01")).toBe(false);
      expect(esFechaIsoValida("2027-00-10")).toBe(false);
    });

    it("rechaza formatos distintos y valores que no son cadenas", () => {
      expect(esFechaIsoValida("01/01/2027")).toBe(false);
      expect(esFechaIsoValida("2027-1-1")).toBe(false);
      expect(esFechaIsoValida("2027-01-01T00:00:00Z")).toBe(false);
      expect(esFechaIsoValida(undefined)).toBe(false);
      expect(esFechaIsoValida(new Date())).toBe(false);
    });
  });

  describe("sumarUnAnio", () => {
    it("mantiene día y mes en un año normal", () => {
      expect(sumarUnAnio("2027-03-15")).toBe("2028-03-15");
    });

    it("recorta el 29 de febrero al 28 cuando el año destino no es bisiesto", () => {
      // Con setFullYear daría 2029-03-01.
      expect(sumarUnAnio("2028-02-29")).toBe("2029-02-28");
    });

    it("conserva el 28 de febrero y el 31 de diciembre", () => {
      expect(sumarUnAnio("2027-02-28")).toBe("2028-02-28");
      expect(sumarUnAnio("2027-12-31")).toBe("2028-12-31");
    });
  });

  describe("diasDelMes", () => {
    it("distingue los febreros bisiestos", () => {
      expect(diasDelMes(2028, 2)).toBe(29);
      expect(diasDelMes(2029, 2)).toBe(28);
      expect(diasDelMes(2100, 2)).toBe(28); // múltiplo de 100 que no es bisiesto
      expect(diasDelMes(2000, 2)).toBe(29); // múltiplo de 400 que sí lo es
    });
  });

  describe("hoyIso", () => {
    it("devuelve la fecha local de hoy, no la UTC", () => {
      const ahora = new Date();
      const esperado = [
        String(ahora.getFullYear()).padStart(4, "0"),
        String(ahora.getMonth() + 1).padStart(2, "0"),
        String(ahora.getDate()).padStart(2, "0"),
      ].join("-");
      expect(hoyIso()).toBe(esperado);
    });

    it("tiene formato válido", () => {
      expect(esFechaIsoValida(hoyIso())).toBe(true);
    });
  });
});
