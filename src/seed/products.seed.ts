import { ProductInterface } from "../interfaces/product.interface";

/** Datos iniciales del listado. */
export const PRODUCTS_SEED: ProductInterface[] = [
  {
    id: "trj-crd",
    name: "Tarjetas de Crédito",
    description: "Tarjeta de consumo bajo la modalidad de crédito",
    logo: "https://www.visa.com.ec/dam/VCOM/regional/lac/SPA/Default/Pay%20With%20Visa/Tarjetas/visa-signature-400x225.jpg",
    date_release: "2027-01-01",
    date_revision: "2028-01-01",
  },
  {
    id: "cta-ahr",
    name: "Cuenta de Ahorros",
    description: "Cuenta de depósito a la vista con rendimiento mensual",
    logo: "https://cdn-icons-png.flaticon.com/512/2830/2830284.png",
    date_release: "2027-02-01",
    date_revision: "2028-02-01",
  },
  {
    id: "cta-cte",
    name: "Cuenta Corriente",
    description: "Cuenta de manejo de fondos con chequera incluida",
    logo: "https://cdn-icons-png.flaticon.com/512/1611/1611179.png",
    date_release: "2027-03-15",
    date_revision: "2028-03-15",
  },
  {
    id: "crd-hip",
    name: "Crédito Hipotecario",
    description: "Financiamiento para vivienda a largo plazo con tasa fija",
    logo: "https://cdn-icons-png.flaticon.com/512/609/609803.png",
    date_release: "2027-04-01",
    date_revision: "2028-04-01",
  },
  {
    id: "crd-veh",
    name: "Crédito Vehicular",
    description: "Financiamiento para compra de vehículo nuevo o usado",
    logo: "https://cdn-icons-png.flaticon.com/512/3085/3085330.png",
    date_release: "2027-05-20",
    date_revision: "2028-05-20",
  },
  {
    id: "inv-plz",
    name: "Inversión a Plazo Fijo",
    description: "Depósito a plazo con tasa preferencial garantizada",
    logo: "https://cdn-icons-png.flaticon.com/512/2920/2920277.png",
    date_release: "2027-06-10",
    date_revision: "2028-06-10",
  },
  {
    id: "seg-vid",
    name: "Seguro de Vida",
    description: "Cobertura de vida con asistencia médica para la familia",
    logo: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
    date_release: "2027-07-01",
    date_revision: "2028-07-01",
  },
];
