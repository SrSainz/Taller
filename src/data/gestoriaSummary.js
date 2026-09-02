import { canonicalizeVehiclePlate } from "./vehicleRegistry";

export const gestoriaEmailAccounts = Object.freeze([
  "davidydiaz@gmail.com",
  "davidydiaz2@gmail.com",
]);

export const gestoriaSender = "alvarosanchez@gestoriaduranrivas.com";

// La cuota que se imputa en Neto es una tarifa mensual fija por vehículo.
// Los documentos importados siguen conservándose para consulta y auditoría,
// pero no deben hacer variar este gasto operativo recurrente.
export const GESTORIA_MONTHLY_FIXED_AMOUNT = 82.72;

export const gestoriaOwnerByKey = Object.freeze({
  david: Object.freeze({ name: "David Díaz Muñoz", initials: "DM", plate: "5043 MLC" }),
  "aida-diaz": Object.freeze({ name: "Aida Díaz Pérez", initials: "ADP", plate: "5750 MJV" }),
  "aida-salt": Object.freeze({ name: "Aida Pérez Salt", initials: "APS", plate: "5754 MJV" }),
});

export const gestoriaImportMeta = Object.freeze({
  sourceLabel: "Gmail · Gestoría Durán Rivas",
  importedAccounts: Object.freeze(["davidydiaz@gmail.com"]),
  pendingAccounts: Object.freeze(["davidydiaz2@gmail.com"]),
  importedDocuments: 95,
  reviewDocuments: 1,
});

export const gestoriaDocuments = Object.freeze([
  {
    "id": "GMAIL-GESTORIA-175221f3100f7061",
    "documentNumber": "GD/145/20",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2020-10-09",
    "periodKey": "2020-10",
    "concept": "Gasto extraordinario de gestoría",
    "concepts": [],
    "amount": 84.7,
    "sourceFile": "201F0000145-00480F.PDF",
    "sourceMessageId": "175221f3100f7061",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1759de743bee8a5c",
    "documentNumber": "GD/357/20",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2020-11-09",
    "periodKey": "2020-11",
    "concept": "Gasto extraordinario de gestoría",
    "concepts": [],
    "amount": 84.7,
    "sourceFile": "201F0000357-00480F.PDF",
    "sourceMessageId": "1759de743bee8a5c",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17646a76f4351540",
    "documentNumber": "GD/593/20",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2020-12-09",
    "periodKey": "2020-12",
    "concept": "Gasto extraordinario de gestoría",
    "concepts": [],
    "amount": 84.7,
    "sourceFile": "201F0000593-00480F.PDF",
    "sourceMessageId": "17646a76f4351540",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-176dc3fcd6ffc542",
    "documentNumber": "GD/175/21",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2021-01-10",
    "periodKey": "2021-01",
    "concept": "Gasto extraordinario de gestoría",
    "concepts": [],
    "amount": 84.7,
    "sourceFile": "211F0000175-00480F.PDF",
    "sourceMessageId": "176dc3fcd6ffc542",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17770e66259de6a1",
    "documentNumber": "GD/175/21",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2021-01-10",
    "periodKey": "2021-01",
    "concept": "Gasto extraordinario de gestoría",
    "concepts": [],
    "amount": 84.7,
    "sourceFile": "211F0000175-00480F.PDF",
    "sourceMessageId": "17770e66259de6a1",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17770ff073d5c3ff",
    "documentNumber": "GD/561/21",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2021-02-10",
    "periodKey": "2021-02",
    "concept": "Gasto extraordinario de gestoría",
    "concepts": [],
    "amount": 84.7,
    "sourceFile": "211F0000561-00480F.PDF",
    "sourceMessageId": "17770ff073d5c3ff",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-177fda78c4f470b1",
    "documentNumber": "GD/1005/21",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2021-03-10",
    "periodKey": "2021-03",
    "concept": "Gasto extraordinario de gestoría",
    "concepts": [],
    "amount": 120.88,
    "sourceFile": "211F0001005-00480F.PDF",
    "sourceMessageId": "177fda78c4f470b1",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17941c742293e809",
    "documentNumber": "GD/1909/21",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2021-05-10",
    "periodKey": "2021-04",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/05/21 CUOTA SERVICIOS FISCALES Abril de"
    ],
    "amount": 36.3,
    "sourceFile": "211F0001909-00480F.PDF",
    "sourceMessageId": "17941c742293e809",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-179d73b7beb05d69",
    "documentNumber": "GD/2501/21",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2021-06-10",
    "periodKey": "2021-05",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/06/21 CUOTA SERVICIOS FISCALES Mayo"
    ],
    "amount": 36.3,
    "sourceFile": "211F0002501-00480F.PDF",
    "sourceMessageId": "179d73b7beb05d69",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17a7bfddf367b064",
    "documentNumber": "GD/3030/21",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2021-07-10",
    "periodKey": "2021-06",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/07/21 CUOTA SERVICIOS FISCALES Junio de"
    ],
    "amount": 36.3,
    "sourceFile": "211F0003030-00480F.PDF",
    "sourceMessageId": "17a7bfddf367b064",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17b1118ac5f40a6b",
    "documentNumber": "GD/3537/21",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2021-08-10",
    "periodKey": "2021-07",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/08/21 CUOTA SERVICIOS FISCALES Julio de"
    ],
    "amount": 72.48,
    "sourceFile": "211F0003537-00480F.PDF",
    "sourceMessageId": "17b1118ac5f40a6b",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17bbb3ef67f1127d",
    "documentNumber": "GD/4039/21",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2021-09-10",
    "periodKey": "2021-08",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/09/21 CUOTA SERVICIOS FISCALES Agosto"
    ],
    "amount": 36.3,
    "sourceFile": "211F0004039-00480F.PDF",
    "sourceMessageId": "17bbb3ef67f1127d",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17c50b213b0317de",
    "documentNumber": "GD/4570/21",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2021-10-10",
    "periodKey": "2021-10",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/10/21 CUOTA SERVICIOS FISCALES"
    ],
    "amount": 36.3,
    "sourceFile": "211F0004570-00480F.PDF",
    "sourceMessageId": "17c50b213b0317de",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17cef7085c9ff926",
    "documentNumber": "GD/5164/21",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2021-11-10",
    "periodKey": "2021-10",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/11/21 CUOTA SERVICIOS FISCALES Octubre"
    ],
    "amount": 36.3,
    "sourceFile": "211F0005164-00480F.PDF",
    "sourceMessageId": "17cef7085c9ff926",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17d8080c01a834ef",
    "documentNumber": "GD/5730/21",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2021-12-10",
    "periodKey": "2021-12",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/12/21 CUOTA SERVICIOS FISCALES"
    ],
    "amount": 36.3,
    "sourceFile": "211F0005730-00480F.PDF",
    "sourceMessageId": "17d8080c01a834ef",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17e2a4affaccf2ef",
    "documentNumber": "GD/278/22",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2022-01-10",
    "periodKey": "2022-01",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/01/22 CUOTA SERVICIOS FISCALES",
      "10/01/22 CUOTA SERVICIOS LABORALES"
    ],
    "amount": 84.7,
    "sourceFile": "221F0000278-00480F.PDF",
    "sourceMessageId": "17e2a4affaccf2ef",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17ec528fd6ec9324",
    "documentNumber": "GD/843/22",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2022-02-10",
    "periodKey": "2022-01",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/02/22 CUOTA SERVICIOS LABORALES Enero",
      "10/02/22 CUOTA SERVICIOS FISCALES Enero"
    ],
    "amount": 54.45,
    "sourceFile": "221F0000843-00480F.PDF",
    "sourceMessageId": "17ec528fd6ec9324",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-17f5475feeca957c",
    "documentNumber": "GD/1452/22",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2022-03-10",
    "periodKey": "2022-02",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/03/22 CUOTA SERVICIOS LABORALES Febrero de 2022 1,00 15,00 15,00",
      "10/03/22 CUOTA SERVICIOS FISCALES Febrero de 2022 1,00 30,00 30,00"
    ],
    "amount": 54.45,
    "sourceFile": "221F0001452-00480F.PDF",
    "sourceMessageId": "17f5475feeca957c",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1800013d32ee8696",
    "documentNumber": "GD/2125/22",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2022-04-10",
    "periodKey": "2022-03",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/04/22 CUOTA SERVICIOS LABORALES Marzo de 2022 2,00 15,00 30,00",
      "10/04/22 CUOTA SERVICIOS FISCALES Marzo de 2022 1,00 30,00 30,00"
    ],
    "amount": 72.6,
    "sourceFile": "221F0002125-00480F.PDF",
    "sourceMessageId": "1800013d32ee8696",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18094706968ec0c2",
    "documentNumber": "GD/2836/22",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2022-05-10",
    "periodKey": "2022-04",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/05/22 CUOTA SERVICIOS LABORALES Abril de 2022 3,00 15,00 45,00",
      "10/05/22 CUOTA SERVICIOS FISCALES Abril de 2022 1,00 30,00 30,00"
    ],
    "amount": 108.9,
    "sourceFile": "221F0002836-00480F.PDF",
    "sourceMessageId": "18094706968ec0c2",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1813936090e6050a",
    "documentNumber": "GD/3440/22",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2022-06-10",
    "periodKey": "2022-05",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/06/22 CUOTA SERVICIOS LABORALES Mayo de 2022 1,00 15,00 15,00",
      "10/06/22 CUOTA SERVICIOS FISCALES Mayo de 2022 1,00 30,00 30,00"
    ],
    "amount": 54.45,
    "sourceFile": "221F0003440-00480F.PDF",
    "sourceMessageId": "1813936090e6050a",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-181d40cc6493e85b",
    "documentNumber": "GD/4071/22",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2022-07-10",
    "periodKey": "2022-06",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/07/22 CUOTA SERVICIOS LABORALES Junio de 2022 2,00 15,00 30,00",
      "10/07/22 CUOTA SERVICIOS FISCALES Junio de 2022 1,00 30,00 30,00"
    ],
    "amount": 72.6,
    "sourceFile": "221F0004071-00480F.PDF",
    "sourceMessageId": "181d40cc6493e85b",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1826970af1fe2624",
    "documentNumber": "GD/4755/22",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2022-08-10",
    "periodKey": "2022-07",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/08/22 CUOTA SERVICIOS LABORALES Julio de 2022 2,00 15,00 30,00",
      "10/08/22 CUOTA SERVICIOS FISCALES Julio de 2022 1,00 30,00 30,00"
    ],
    "amount": 72.6,
    "sourceFile": "221F0004755-00480F.PDF",
    "sourceMessageId": "1826970af1fe2624",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-182fe5f084ae5a15",
    "documentNumber": "GD/5371/22",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2022-09-10",
    "periodKey": "2022-08",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/09/22 CUOTA SERVICIOS LABORALES Agosto de 2022 2,00 15,00 30,00",
      "10/09/22 CUOTA SERVICIOS FISCALES Agosto de 2022 1,00 30,00 30,00"
    ],
    "amount": 72.6,
    "sourceFile": "221F0005371-00480F.PDF",
    "sourceMessageId": "182fe5f084ae5a15",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-183abf9d503efd7d",
    "documentNumber": "GD/5971/22",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2022-10-10",
    "periodKey": "2022-09",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/10/22 CUOTA SERVICIOS LABORALES Septiembre de 2022 2,00 15,00 30,00",
      "10/10/22 CUOTA SERVICIOS FISCALES 1,00 30,00 30,00"
    ],
    "amount": 72.6,
    "sourceFile": "221F0005971-00480F.PDF",
    "sourceMessageId": "183abf9d503efd7d",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1846139f4de81cbd",
    "documentNumber": "GD/6900/22",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2022-11-10",
    "periodKey": "2022-11",
    "concept": "10/11/22 VISADO TARJETA DE TRANSPORTE 2022 1,00 25,00 25,00",
    "concepts": [
      "10/11/22 VISADO TARJETA DE TRANSPORTE 2022 1,00 25,00 25,00",
      "10/11/22 TASA COMUNIDAD DE MADRID 1,00 36,01 36,01"
    ],
    "amount": 66.26,
    "sourceFile": "FACTURA_GD_6900_22.pdf",
    "sourceMessageId": "1846139f4de81cbd",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-184d486a0cd9b60c",
    "documentNumber": "GD/7253/22",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2022-12-10",
    "periodKey": "2022-11",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/12/22 CUOTA SERVICIOS LABORALES Noviembre de 2022 2,00 15,00 30,00",
      "10/12/22 CUOTA SERVICIOS FISCALES 1,00 30,00 30,00"
    ],
    "amount": 72.6,
    "sourceFile": "221F0007253-00480F.PDF",
    "sourceMessageId": "184d486a0cd9b60c",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1857d2b73f217ef1",
    "documentNumber": "GD/250/23",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2023-01-10",
    "periodKey": "2022-12",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "10/01/23 CUOTA SERVICIOS LABORALES Diciembre de 2022 2,00 15,00 30,00",
      "10/01/23 CUOTA SERVICIOS FISCALES 1,00 30,00 30,00"
    ],
    "amount": 72.6,
    "sourceFile": "231F0000250-00480F.PDF",
    "sourceMessageId": "1857d2b73f217ef1",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18613df872a990e9",
    "documentNumber": "GD/874/23",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2023-02-10",
    "periodKey": "2023-01",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS LABORALES Enero de 2023 2,00 16,50 33,00",
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50"
    ],
    "amount": 80.47,
    "sourceFile": "231F0000874-00480F.PDF",
    "sourceMessageId": "18613df872a990e9",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-186a7dcc69f67ed9",
    "documentNumber": "GD/1462/23",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2023-03-10",
    "periodKey": "2023-02",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS LABORALES Febrero de 2023 2,00 16,50 33,00",
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50"
    ],
    "amount": 80.47,
    "sourceFile": "231F0001462-00480F.PDF",
    "sourceMessageId": "186a7dcc69f67ed9",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1874c7d7fc126b44",
    "documentNumber": "GD/2041/23",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2023-04-10",
    "periodKey": "2023-03",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS LABORALES Marzo de 2023 2,00 16,50 33,00",
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50"
    ],
    "amount": 80.47,
    "sourceFile": "231F0002041-00480F.PDF",
    "sourceMessageId": "1874c7d7fc126b44",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-187e791b12b23b97",
    "documentNumber": "GD/2634/23",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2023-05-10",
    "periodKey": "2023-04",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS LABORALES Abril de 2023 2,00 16,50 33,00",
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50"
    ],
    "amount": 80.47,
    "sourceFile": "231F0002634-00480F.PDF",
    "sourceMessageId": "187e791b12b23b97",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1887c4831471bf69",
    "documentNumber": "GD/3409/23",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2023-06-10",
    "periodKey": "2023-05",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS LABORALES Mayo de 2023 2,00 16,50 33,00",
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50"
    ],
    "amount": 80.47,
    "sourceFile": "231F0003409-00480F.PDF",
    "sourceMessageId": "1887c4831471bf69",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1892115c8fa0f7d3",
    "documentNumber": "GD/4134/23",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2023-07-10",
    "periodKey": "2023-06",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Junio de 2023 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "231F0004134-00480F.PDF",
    "sourceMessageId": "1892115c8fa0f7d3",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-189b68db36c4a5d4",
    "documentNumber": "GD/4715/23",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2023-08-10",
    "periodKey": "2023-07",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS LABORALES Julio de 2023 2,00 16,50 33,00",
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50"
    ],
    "amount": 80.47,
    "sourceFile": "231F0004715-00480F.PDF",
    "sourceMessageId": "189b68db36c4a5d4",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18a65e38843220b6",
    "documentNumber": "GD/5357/23",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2023-09-10",
    "periodKey": "2023-08",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS LABORALES Agosto de 2023 4,00 16,50 66,00",
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50"
    ],
    "amount": 120.4,
    "sourceFile": "231F0005357-00480F.PDF",
    "sourceMessageId": "18a65e38843220b6",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18afae417d4d4860",
    "documentNumber": "GD/6023/23",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2023-10-10",
    "periodKey": "2023-09",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS LABORALES Septiembre de 2023 3,00 16,50 49,50",
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50"
    ],
    "amount": 100.43,
    "sourceFile": "231F0006023-00480F.PDF",
    "sourceMessageId": "18afae417d4d4860",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18a660959ba1145d",
    "documentNumber": "GD/5659/23",
    "plate": "5750 MJV",
    "plateReference": "",
    "ownerKey": "aida-diaz",
    "dateIso": "2023-09-10",
    "periodKey": "2023-09",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50"
    ],
    "amount": 40.54,
    "sourceFile": "231F0005659-91310F.PDF",
    "sourceMessageId": "18a660959ba1145d",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18afb0789566dd22",
    "documentNumber": "GD/6325/23",
    "plate": "5750 MJV",
    "plateReference": "",
    "ownerKey": "aida-diaz",
    "dateIso": "2023-10-10",
    "periodKey": "2023-09",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS LABORALES Septiembre de 2023 3,00 16,50 49,50",
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50"
    ],
    "amount": 100.43,
    "sourceFile": "231F0006325-91310F.PDF",
    "sourceMessageId": "18afb0789566dd22",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18a65dfc9a51b862",
    "documentNumber": "GD/5326/23",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2023-09-10",
    "periodKey": "2023-09",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50"
    ],
    "amount": 40.54,
    "sourceFile": "231F0005326-00429F.PDF",
    "sourceMessageId": "18a65dfc9a51b862",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18afae04ee37368a",
    "documentNumber": "GD/5992/23",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2023-10-10",
    "periodKey": "2023-09",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS LABORALES Septiembre de 2023 4,00 16,50 66,00",
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50"
    ],
    "amount": 120.4,
    "sourceFile": "231F0005992-00429F.PDF",
    "sourceMessageId": "18afae04ee37368a",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18ba50367318dfe1",
    "documentNumber": "GD/6848/23",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2023-11-10",
    "periodKey": "2023-10",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Octubre de 2023 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "231F0006848-00480F.PDF",
    "sourceMessageId": "18ba50367318dfe1",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18ba52546420e6de",
    "documentNumber": "GD/7152/23",
    "plate": "5750 MJV",
    "plateReference": "",
    "ownerKey": "aida-diaz",
    "dateIso": "2023-11-10",
    "periodKey": "2023-10",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Octubre de 2023 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "231F0007152-91310F.PDF",
    "sourceMessageId": "18ba52546420e6de",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18ba4ffb6e8b8c2c",
    "documentNumber": "GD/6817/23",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2023-11-10",
    "periodKey": "2023-10",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Octubre de 2023 3,00 16,50 49,50"
    ],
    "amount": 100.43,
    "sourceFile": "231F0006817-00429F.PDF",
    "sourceMessageId": "18ba4ffb6e8b8c2c",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18bd2278054a3a95",
    "documentNumber": "GD/7195/23",
    "plate": "5043 MLC",
    "plateReference": "5043MLC",
    "ownerKey": "david",
    "dateIso": "2023-11-15",
    "periodKey": "2023-11",
    "concept": "SUSTITUCION VEHICULO VTC 12050811-5043MLC 1,00 39,66 39,66",
    "concepts": [
      "SUSTITUCION VEHICULO VTC 12050811-5043MLC 1,00 39,66 39,66",
      "TASA COMUNIDAD DE MADRID 1,00 36,01 36,01"
    ],
    "amount": 84,
    "sourceFile": "FACTURA_GD_7195_23.pdf",
    "sourceMessageId": "18bd2278054a3a95",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18e103106e763d58",
    "documentNumber": "GD/1543/24",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2024-03-10",
    "periodKey": "2024-02",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Febrero de 2024 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "241F0001543-00480F.PDF",
    "sourceMessageId": "18e103106e763d58",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18e1054993ac7ed5",
    "documentNumber": "GD/1833/24",
    "plate": "5750 MJV",
    "plateReference": "",
    "ownerKey": "aida-diaz",
    "dateIso": "2024-03-10",
    "periodKey": "2024-02",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Febrero de 2024 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "241F0001833-91310F.PDF",
    "sourceMessageId": "18e1054993ac7ed5",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18db237492a8c57e",
    "documentNumber": "GD/1300/24",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2024-02-17",
    "periodKey": "2024-02",
    "concept": "VISADO TARJETA DE TRANSPORTE 2024 1,00 30,00 30,00",
    "concepts": [
      "VISADO TARJETA DE TRANSPORTE 2024 1,00 30,00 30,00",
      "TASA COMUNIDAD DE MADRID 1,00 36,01 36,01"
    ],
    "amount": 72.31,
    "sourceFile": "241F0001300-00429F.PDF",
    "sourceMessageId": "18db237492a8c57e",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18e102d4635f0367",
    "documentNumber": "GD/1514/24",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2024-03-10",
    "periodKey": "2024-02",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Febrero de 2024 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "241F0001514-00429F.PDF",
    "sourceMessageId": "18e102d4635f0367",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18ea42723870cb10",
    "documentNumber": "GD/2251/24",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2024-04-10",
    "periodKey": "2024-03",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Marzo de 2024 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "241F0002251-00480F.PDF",
    "sourceMessageId": "18ea42723870cb10",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18ea44c0093e1984",
    "documentNumber": "GD/2539/24",
    "plate": "5750 MJV",
    "plateReference": "",
    "ownerKey": "aida-diaz",
    "dateIso": "2024-04-10",
    "periodKey": "2024-03",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Marzo de 2024 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "241F0002539-91310F.PDF",
    "sourceMessageId": "18ea44c0093e1984",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18ea4235152d2506",
    "documentNumber": "GD/2222/24",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2024-04-10",
    "periodKey": "2024-03",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Marzo de 2024 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "241F0002222-00429F.PDF",
    "sourceMessageId": "18ea4235152d2506",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18f2de4438f17264",
    "documentNumber": "GD/2709/24",
    "plate": "",
    "plateReference": "M4445OX",
    "ownerKey": "david",
    "dateIso": "2024-04-30",
    "periodKey": "2024-04",
    "concept": "HONORARIOS CAMBIO TITULAR VEHICULO M4445OX 1,00 51,49 51,49",
    "concepts": [
      "HONORARIOS CAMBIO TITULAR VEHICULO M4445OX 1,00 51,49 51,49",
      "TASA DGT 1.5 1,00 55,70 55,70",
      "TASA COLEGIAL TRANSFERENCIA 1,00 7,87 7,87",
      "MODELO 620 1,00 32,00 32,00"
    ],
    "amount": 157.87,
    "sourceFile": "FACTURA_GD_2709_24.pdf",
    "sourceMessageId": "18f2de4438f17264",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": true
  },
  {
    "id": "GMAIL-GESTORIA-18f4e26b29a79bd1",
    "documentNumber": "GD/2926/24",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2024-05-10",
    "periodKey": "2024-04",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Abril de 2024 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "241F0002926-00480F.PDF",
    "sourceMessageId": "18f4e26b29a79bd1",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18f4e4c13939eba4",
    "documentNumber": "GD/3210/24",
    "plate": "5750 MJV",
    "plateReference": "",
    "ownerKey": "aida-diaz",
    "dateIso": "2024-05-10",
    "periodKey": "2024-04",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Abril de 2024 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "241F0003210-91310F.PDF",
    "sourceMessageId": "18f4e4c13939eba4",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18f4e22fb9e485d5",
    "documentNumber": "GD/2898/24",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2024-05-10",
    "periodKey": "2024-04",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Abril de 2024 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "241F0002898-00429F.PDF",
    "sourceMessageId": "18f4e22fb9e485d5",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18fe6f29e3342b20",
    "documentNumber": "GD/3633/24",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2024-06-10",
    "periodKey": "2024-05",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Mayo de 2024 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "241F0003633-00480F.PDF",
    "sourceMessageId": "18fe6f29e3342b20",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18fe7131edc1374f",
    "documentNumber": "GD/3921/24",
    "plate": "5750 MJV",
    "plateReference": "",
    "ownerKey": "aida-diaz",
    "dateIso": "2024-06-10",
    "periodKey": "2024-05",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Mayo de 2024 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "241F0003921-91310F.PDF",
    "sourceMessageId": "18fe7131edc1374f",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-18fe6efe7c9e927f",
    "documentNumber": "GD/3605/24",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2024-06-10",
    "periodKey": "2024-05",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 33,50 33,50",
      "CUOTA SERVICIOS LABORALES Mayo de 2024 2,00 16,50 33,00"
    ],
    "amount": 80.47,
    "sourceFile": "241F0003605-00429F.PDF",
    "sourceMessageId": "18fe6efe7c9e927f",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19602857f159af1d",
    "documentNumber": "GD/1136/25",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2025-04-10",
    "periodKey": "2025-03",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Marzo de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0001136-00480F.PDF",
    "sourceMessageId": "19602857f159af1d",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1960282aaa3572f4",
    "documentNumber": "GD/1110/25",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2025-04-10",
    "periodKey": "2025-03",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Marzo de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0001110-00429F.PDF",
    "sourceMessageId": "1960282aaa3572f4",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-196a0c498e029aca",
    "documentNumber": "GD/1892/25",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2025-05-10",
    "periodKey": "2025-04",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Abril de 2025 3,00 16,96 50,88"
    ],
    "amount": 103.24,
    "sourceFile": "251F0001892-00480F.PDF",
    "sourceMessageId": "196a0c498e029aca",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-196a0c1cdf4018c4",
    "documentNumber": "GD/1866/25",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2025-05-10",
    "periodKey": "2025-04",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Abril de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0001866-00429F.PDF",
    "sourceMessageId": "196a0c1cdf4018c4",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-197402d08894cf49",
    "documentNumber": "GD/2609/25",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2025-06-10",
    "periodKey": "2025-05",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Mayo de 2025 3,00 16,96 50,88"
    ],
    "amount": 103.24,
    "sourceFile": "251F0002609-00480F.PDF",
    "sourceMessageId": "197402d08894cf49",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-197402a4c366eb3b",
    "documentNumber": "GD/2583/25",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2025-06-10",
    "periodKey": "2025-05",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Mayo de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0002583-00429F.PDF",
    "sourceMessageId": "197402a4c366eb3b",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-197d075151d2545d",
    "documentNumber": "GD/3442/25",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2025-07-10",
    "periodKey": "2025-06",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Junio de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0003442-00480F.PDF",
    "sourceMessageId": "197d075151d2545d",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-197d07248b5bb122",
    "documentNumber": "GD/3416/25",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2025-07-10",
    "periodKey": "2025-06",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Junio de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0003416-00429F.PDF",
    "sourceMessageId": "197d07248b5bb122",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1987a7111c9ea8ce",
    "documentNumber": "GD/4221/25",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2025-08-10",
    "periodKey": "2025-07",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Julio de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0004221-00480F.PDF",
    "sourceMessageId": "1987a7111c9ea8ce",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1987a6d44242c4de",
    "documentNumber": "GD/4195/25",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2025-08-10",
    "periodKey": "2025-07",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Julio de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0004195-00429F.PDF",
    "sourceMessageId": "1987a6d44242c4de",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1990fc2d4d07fe7e",
    "documentNumber": "GD/4914/25",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2025-09-10",
    "periodKey": "2025-08",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Agosto de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0004914-00480F.PDF",
    "sourceMessageId": "1990fc2d4d07fe7e",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-1990fbf231f63cdd",
    "documentNumber": "GD/4888/25",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2025-09-10",
    "periodKey": "2025-08",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Agosto de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0004888-00429F.PDF",
    "sourceMessageId": "1990fbf231f63cdd",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-199aa38265e59a09",
    "documentNumber": "GD/5659/25",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2025-10-10",
    "periodKey": "2025-09",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Septiembre de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0005659-00480F.PDF",
    "sourceMessageId": "199aa38265e59a09",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-199aa34655a04961",
    "documentNumber": "GD/5634/25",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2025-10-10",
    "periodKey": "2025-09",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Septiembre de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0005634-00429F.PDF",
    "sourceMessageId": "199aa34655a04961",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19a4fd4650b86cec",
    "documentNumber": "GD/6374/25",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2025-11-10",
    "periodKey": "2025-10",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Octubre de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0006374-00480F.PDF",
    "sourceMessageId": "19a4fd4650b86cec",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19a4fd19faf8c233",
    "documentNumber": "GD/6349/25",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2025-11-10",
    "periodKey": "2025-10",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Octubre de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0006349-00429F.PDF",
    "sourceMessageId": "19a4fd19faf8c233",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19a91a8582f9d1b4",
    "documentNumber": "GD/6928/25",
    "plate": "0344 LCP",
    "plateReference": "0344LCP",
    "ownerKey": "david",
    "dateIso": "2025-11-17",
    "periodKey": "2025-11",
    "concept": "LEVANTAMIENTO RESERVA DE DOMINIO VEHICULO",
    "concepts": [
      "LEVANTAMIENTO RESERVA DE DOMINIO VEHICULO",
      "TASA LEVANTAMIENTO 1,00 62,21 62,21"
    ],
    "amount": 93.31,
    "sourceFile": "FACTURA_GD_6928_25.pdf",
    "sourceMessageId": "19a91a8582f9d1b4",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19adf7c7342ea9d9",
    "documentNumber": "GD/7154/25",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2025-12-05",
    "periodKey": "2025-11",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Noviembre de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0007154-00480F.PDF",
    "sourceMessageId": "19adf7c7342ea9d9",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19adf776d3ed999c",
    "documentNumber": "GD/7129/25",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2025-12-05",
    "periodKey": "2025-11",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Noviembre de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "251F0007129-00429F.PDF",
    "sourceMessageId": "19adf776d3ed999c",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19b8e7f48472c8ed",
    "documentNumber": "GD/163/26",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2026-01-05",
    "periodKey": "2025-12",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Diciembre de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0000163-00480F.PDF",
    "sourceMessageId": "19b8e7f48472c8ed",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19b8e7b870137890",
    "documentNumber": "GD/138/26",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2026-01-05",
    "periodKey": "2025-12",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Diciembre de 2025 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0000138-00429F.PDF",
    "sourceMessageId": "19b8e7b870137890",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19c2918373b6a54c",
    "documentNumber": "GD/985/26",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2026-02-05",
    "periodKey": "2026-01",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Enero de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0000985-00480F.PDF",
    "sourceMessageId": "19c2918373b6a54c",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19c29145908895c9",
    "documentNumber": "GD/958/26",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2026-02-05",
    "periodKey": "2026-01",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Enero de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0000958-00429F.PDF",
    "sourceMessageId": "19c29145908895c9",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19cb94323f6524fb",
    "documentNumber": "GD/1822/26",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2026-03-05",
    "periodKey": "2026-02",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Febrero de 2026 2,00 16,96 33,92"
    ],
    "amount": 155.32,
    "sourceFile": "261F0001822-00480F.PDF",
    "sourceMessageId": "19cb94323f6524fb",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19c9e5cc06b5e650",
    "documentNumber": "GD/1642/26",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2026-02-27",
    "periodKey": "2026-02",
    "concept": "VISADO TARJETA DE TRANSPORTE VTC 2026 1,00 30,00 30,00",
    "concepts": [
      "VISADO TARJETA DE TRANSPORTE VTC 2026 1,00 30,00 30,00",
      "TASA COMUNIDAD DE MADRID 1,00 36,01 36,01"
    ],
    "amount": 72.31,
    "sourceFile": "261F0001642-00429F.PDF",
    "sourceMessageId": "19c9e5cc06b5e650",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": false,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19cb93e6508461c4",
    "documentNumber": "GD/1796/26",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2026-03-05",
    "periodKey": "2026-02",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Febrero de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0001796-00429F.PDF",
    "sourceMessageId": "19cb93e6508461c4",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19d4939cd29000f6",
    "documentNumber": "GD/2643/26",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2026-04-05",
    "periodKey": "2026-03",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Marzo de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0002643-00480F.PDF",
    "sourceMessageId": "19d4939cd29000f6",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19d49360f0997990",
    "documentNumber": "GD/2617/26",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2026-04-05",
    "periodKey": "2026-03",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Marzo de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0002617-00429F.PDF",
    "sourceMessageId": "19d49360f0997990",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19df855ed89f7fe5",
    "documentNumber": "GD/3575/26",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2026-05-05",
    "periodKey": "2026-04",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Abril de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0003575-00480F.PDF",
    "sourceMessageId": "19df855ed89f7fe5",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19df85031934331c",
    "documentNumber": "GD/3549/26",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2026-05-05",
    "periodKey": "2026-04",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Abril de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0003549-00429F.PDF",
    "sourceMessageId": "19df85031934331c",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19e8da5ba6d6b382",
    "documentNumber": "GD/4420/26",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2026-06-05",
    "periodKey": "2026-05",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Mayo de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0004420-00480F.PDF",
    "sourceMessageId": "19e8da5ba6d6b382",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19e8da206b839b40",
    "documentNumber": "GD/4395/26",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2026-06-05",
    "periodKey": "2026-05",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Mayo de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0004395-00429F.PDF",
    "sourceMessageId": "19e8da206b839b40",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19f379f3c340981e",
    "documentNumber": "GD/5349/26",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2026-07-05",
    "periodKey": "2026-06",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Junio de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0005349-00480F.PDF",
    "sourceMessageId": "19f379f3c340981e",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19f379b76766c65e",
    "documentNumber": "GD/5324/26",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2026-07-05",
    "periodKey": "2026-06",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Junio de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0005324-00429F.PDF",
    "sourceMessageId": "19f379b76766c65e",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19fcce8d26ac6dba",
    "documentNumber": "GD/6260/26",
    "plate": "5043 MLC",
    "plateReference": "",
    "ownerKey": "david",
    "dateIso": "2026-08-05",
    "periodKey": "2026-07",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Julio de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0006260-00480F.PDF",
    "sourceMessageId": "19fcce8d26ac6dba",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  },
  {
    "id": "GMAIL-GESTORIA-19fcce6069db75ab",
    "documentNumber": "GD/6235/26",
    "plate": "5754 MJV",
    "plateReference": "",
    "ownerKey": "aida-salt",
    "dateIso": "2026-08-05",
    "periodKey": "2026-07",
    "concept": "Cuota mensual de gestoría",
    "concepts": [
      "CUOTA SERVICIOS FISCALES 1,00 34,44 34,44",
      "CUOTA SERVICIOS LABORALES Julio de 2026 2,00 16,96 33,92"
    ],
    "amount": 82.72,
    "sourceFile": "261F0006235-00429F.PDF",
    "sourceMessageId": "19fcce6069db75ab",
    "sourceAccount": "davidydiaz@gmail.com",
    "recurring": true,
    "needsReview": false
  }
]);

const getPeriodKey = (year, month) => `${year}-${String(Number(month) + 1).padStart(2, "0")}`;

export const getGestoriaDocumentsForPeriod = (plate, year, month) => {
  const canonicalPlate = canonicalizeVehiclePlate(plate);
  return gestoriaDocuments.filter((document) => (
    document.periodKey === getPeriodKey(year, month)
    && canonicalizeVehiclePlate(document.plate) === canonicalPlate
  ));
};

export const getGestoriaExpenseForPeriod = (plate, year, month) => (
  getGestoriaDocumentsForPeriod(plate, year, month)
    .reduce((total, document) => total + Number(document.amount || 0), 0)
);
