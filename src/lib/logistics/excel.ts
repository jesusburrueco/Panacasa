import ExcelJS from "exceljs";
import { formatDateEs, type AlbaranSummary } from "./types";

const THIN = { style: "thin" as const, color: { argb: "FF000000" } };
const COLUMN_HEADERS = ["Dirección", "Cliente", "Cantidad", "Tipo de pan", "Total dirección", "Teléfono"];

// Excel nunca dibuja los bordes internos de un rango combinado (solo el
// perimetro exterior), asi que basta con aplicar el borde completo a cada
// celda para que tanto las filas combinadas (recuadro) como las filas
// normales (cuadricula completa) se rendericen correctamente.
function applyGridBorder(sheet: ExcelJS.Worksheet, rowNumber: number) {
  for (let col = 1; col <= 6; col++) {
    const cell = sheet.getCell(rowNumber, col);
    cell.alignment = { ...(cell.alignment ?? {}), vertical: "middle" };
    cell.border = { top: THIN, bottom: THIN, left: THIN, right: THIN };
  }
}

/**
 * Genera el workbook del albaran de produccion y reparto replicando el
 * formato de la plantilla Albaran_PanACasa_ejemplo.xlsx: cuadricula de
 * bordes finos sin relleno de color, cabecera con celdas combinadas,
 * resumen de produccion, desglose total por tipo de pan y, por cada zona
 * (barrio), una tabla Direccion | Cliente | Cantidad | Tipo de pan |
 * Total direccion | Telefono agrupada por direccion (urbanizacion/portal/piso
 * tal cual figura en el perfil del cliente).
 */
export async function buildAlbaranWorkbook(summary: AlbaranSummary): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PanACasa";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Albaran", {
    views: [{ state: "frozen", ySplit: 7, showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: "portrait", fitToWidth: 1, fitToHeight: 0 },
  });

  sheet.columns = [
    { width: 36 },
    { width: 24 },
    { width: 11 },
    { width: 26 },
    { width: 16 },
    { width: 16 },
  ];

  let row = 1;

  applyGridBorder(sheet, row);
  const titleCell = sheet.getCell(row, 1);
  titleCell.value = "ALBARÁN DE PRODUCCIÓN Y REPARTO";
  titleCell.font = { bold: true, size: 16 };
  sheet.mergeCells(row, 1, row, 6);
  row++;

  row++; // fila en blanco

  sheet.getCell(row, 1).value = "Nombre de la empresa:";
  sheet.getCell(row, 1).font = { bold: true };
  sheet.getCell(row, 2).value = "PANACASA";
  sheet.getCell(row, 4).value = "Fecha:";
  sheet.getCell(row, 4).font = { bold: true };
  sheet.getCell(row, 5).value = formatDateEs(summary.date);
  sheet.getCell(row, 6).value = summary.weekday.toUpperCase();
  applyGridBorder(sheet, row);
  row++;

  row++; // fila en blanco

  sheet.getCell(row, 1).value = "BARRAS TOTALES A HORNEAR";
  sheet.getCell(row, 1).font = { bold: true };
  sheet.getCell(row, 2).value = summary.totalBarras;
  sheet.getCell(row, 2).font = { bold: true, size: 13 };
  sheet.getCell(row, 4).value = "CLIENTES CON ENTREGA";
  sheet.getCell(row, 4).font = { bold: true };
  sheet.getCell(row, 5).value = summary.totalClientes;
  sheet.getCell(row, 5).font = { bold: true, size: 13 };
  applyGridBorder(sheet, row);
  row++;

  row++; // fila en blanco

  sheet.getCell(row, 1).value = "DESGLOSE TOTAL DE BARRAS";
  sheet.getCell(row, 1).font = { bold: true };
  applyGridBorder(sheet, row);
  row++;

  for (const item of summary.breakdownByProduct) {
    sheet.getCell(row, 1).value = item.productName;
    sheet.getCell(row, 2).value = item.quantity;
    applyGridBorder(sheet, row);
    row++;
  }

  sheet.getCell(row, 1).value = "TOTAL";
  sheet.getCell(row, 1).font = { bold: true };
  sheet.getCell(row, 2).value = summary.totalBarras;
  sheet.getCell(row, 2).font = { bold: true };
  applyGridBorder(sheet, row);
  row++;

  row++; // fila en blanco
  row++; // fila en blanco

  applyGridBorder(sheet, row);
  const sectionCell = sheet.getCell(row, 1);
  sectionCell.value = "DESGLOSE DE REPARTO POR ZONA Y DIRECCIÓN";
  sectionCell.font = { bold: true, size: 13 };
  sheet.mergeCells(row, 1, row, 6);
  row++;

  row++; // fila en blanco

  if (summary.zones.length === 0) {
    applyGridBorder(sheet, row);
    sheet.getCell(row, 1).value = "No hay clientes activos con entrega este día.";
    sheet.getCell(row, 1).font = { italic: true };
    sheet.mergeCells(row, 1, row, 6);
    row++;
  }

  for (const zone of summary.zones) {
    applyGridBorder(sheet, row);
    const zoneHeaderCell = sheet.getCell(row, 1);
    zoneHeaderCell.value = `Zona ${zone.zoneName} — TOTAL: ${zone.totalBarras} BARRAS (${zone.totalClientes} clientes)`;
    zoneHeaderCell.font = { bold: true, size: 12 };
    sheet.mergeCells(row, 1, row, 6);
    row++;

    COLUMN_HEADERS.forEach((label, index) => {
      const cell = sheet.getCell(row, index + 1);
      cell.value = label;
      cell.font = { bold: true };
    });
    applyGridBorder(sheet, row);
    row++;

    for (const group of zone.addresses) {
      let first = true;
      for (const customer of group.customers) {
        const items =
          customer.items.length > 0 ? customer.items : [{ productName: "—", quantity: 0 }];
        items.forEach((item, index) => {
          if (first) {
            sheet.getCell(row, 1).value = group.address;
            sheet.getCell(row, 1).font = { bold: true };
            sheet.getCell(row, 5).value = group.totalBarras;
            sheet.getCell(row, 5).font = { bold: true };
            first = false;
          }
          if (index === 0) {
            sheet.getCell(row, 2).value = customer.customerName;
            sheet.getCell(row, 6).value = customer.phone ?? "";
          }
          sheet.getCell(row, 3).value = item.quantity;
          sheet.getCell(row, 4).value = item.productName;
          applyGridBorder(sheet, row);
          row++;
        });
      }
    }

    applyGridBorder(sheet, row);
    row++; // fila en blanco (con cuadricula, como en la plantilla)
  }

  return workbook;
}

export async function albaranWorkbookToBase64(summary: AlbaranSummary): Promise<string> {
  const workbook = await buildAlbaranWorkbook(summary);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}
