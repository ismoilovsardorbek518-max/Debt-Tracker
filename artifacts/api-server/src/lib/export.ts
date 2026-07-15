import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const BRAND_COLOR = "1F4E3D";
const HEADER_FILL = "1F4E3D";
const RECEIVABLE_FILL = "E5F5EC";
const PAYABLE_FILL = "FDEAEA";

const paymentTypeLabel: Record<string, string> = {
  cash: "Naqd",
  card: "Plastik karta",
  transfer: "Bank o'tkazmasi",
};

function styleHeaderRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${HEADER_FILL}` },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });
}

function addTitle(
  sheet: ExcelJS.Worksheet,
  title: string,
  columnCount: number,
): void {
  sheet.mergeCells(1, 1, 1, columnCount);
  const cell = sheet.getCell(1, 1);
  cell.value = title;
  cell.font = { bold: true, size: 14, color: { argb: `FF${BRAND_COLOR}` } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 28;
}

export async function buildClientsWorkbook(
  clients: {
    id: number;
    name: string;
    territory: string;
    phone: string | null;
    responsiblePerson: string | null;
    balance: number;
  }[],
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Klientlar");

  addTitle(sheet, "Klientlar ro'yxati", 6);
  sheet.addRow([]);

  const headerRow = sheet.addRow([
    "ID",
    "Nomi",
    "Hudud",
    "Telefon",
    "Mas'ul shaxs",
    "Balans",
  ]);
  styleHeaderRow(headerRow);

  for (const c of clients) {
    const row = sheet.addRow([
      c.id,
      c.name,
      c.territory,
      c.phone ?? "",
      c.responsiblePerson ?? "",
      c.balance,
    ]);
    const balanceCell = row.getCell(6);
    balanceCell.numFmt = "#,##0.00";
    balanceCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${c.balance >= 0 ? RECEIVABLE_FILL : PAYABLE_FILL}` },
    };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFDDDDDD" } },
        bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
        left: { style: "thin", color: { argb: "FFDDDDDD" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } },
      };
    });
  }

  sheet.columns = [
    { width: 8 },
    { width: 28 },
    { width: 18 },
    { width: 16 },
    { width: 20 },
    { width: 16 },
  ];

  return workbook.xlsx.writeBuffer();
}

export async function buildTransactionsWorkbook(
  transactions: {
    id: number;
    clientName: string;
    type: "income" | "expense";
    amount: number;
    date: string;
    paymentType: "cash" | "card" | "transfer";
    responsiblePerson: string;
    comment: string | null;
  }[],
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Operatsiyalar");

  addTitle(sheet, "Operatsiyalar ro'yxati", 7);
  sheet.addRow([]);

  const headerRow = sheet.addRow([
    "Sana",
    "Klient",
    "Turi",
    "Summa",
    "To'lov turi",
    "Mas'ul shaxs",
    "Izoh",
  ]);
  styleHeaderRow(headerRow);

  for (const t of transactions) {
    const row = sheet.addRow([
      t.date,
      t.clientName,
      t.type === "income" ? "Kirim" : "Chiqim",
      t.amount,
      paymentTypeLabel[t.paymentType] ?? t.paymentType,
      t.responsiblePerson,
      t.comment ?? "",
    ]);
    row.getCell(4).numFmt = "#,##0.00";
    row.getCell(3).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: `FF${t.type === "income" ? RECEIVABLE_FILL : PAYABLE_FILL}`,
      },
    };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFDDDDDD" } },
        bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
        left: { style: "thin", color: { argb: "FFDDDDDD" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } },
      };
    });
  }

  sheet.columns = [
    { width: 14 },
    { width: 26 },
    { width: 12 },
    { width: 16 },
    { width: 18 },
    { width: 20 },
    { width: 30 },
  ];

  return workbook.xlsx.writeBuffer();
}

export interface AktSverkaData {
  clientName: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  closingBalance: number;
  rows: {
    date: string;
    comment: string | null;
    responsiblePerson: string;
    paymentType: "cash" | "card" | "transfer";
    debit: number;
    credit: number;
    balance: number;
  }[];
}

export async function buildAktSverkaWorkbook(
  data: AktSverkaData,
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Akt Sverka");

  addTitle(sheet, `Akt Sverka — ${data.clientName}`, 7);
  const periodRow = sheet.addRow([
    `Davr: ${data.periodStart} — ${data.periodEnd}`,
  ]);
  sheet.mergeCells(periodRow.number, 1, periodRow.number, 7);
  periodRow.getCell(1).font = { italic: true, color: { argb: "FF555555" } };

  const openingRow = sheet.addRow([
    "Boshlang'ich qoldiq:",
    "",
    "",
    "",
    "",
    "",
    data.openingBalance,
  ]);
  openingRow.getCell(1).font = { bold: true };
  openingRow.getCell(7).numFmt = "#,##0.00";
  openingRow.getCell(7).font = { bold: true };

  sheet.addRow([]);

  const headerRow = sheet.addRow([
    "Sana",
    "Izoh",
    "Mas'ul shaxs",
    "To'lov turi",
    "Debet (chiqim)",
    "Kredit (kirim)",
    "Qoldiq",
  ]);
  styleHeaderRow(headerRow);

  for (const r of data.rows) {
    const row = sheet.addRow([
      r.date,
      r.comment ?? "",
      r.responsiblePerson,
      paymentTypeLabel[r.paymentType] ?? r.paymentType,
      r.debit || "",
      r.credit || "",
      r.balance,
    ]);
    row.getCell(5).numFmt = "#,##0.00";
    row.getCell(6).numFmt = "#,##0.00";
    row.getCell(7).numFmt = "#,##0.00";
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFDDDDDD" } },
        bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
        left: { style: "thin", color: { argb: "FFDDDDDD" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } },
      };
    });
  }

  sheet.addRow([]);
  const closingRow = sheet.addRow([
    "Yakuniy qoldiq:",
    "",
    "",
    "",
    "",
    "",
    data.closingBalance,
  ]);
  closingRow.getCell(1).font = { bold: true };
  closingRow.getCell(7).numFmt = "#,##0.00";
  closingRow.getCell(7).font = { bold: true };
  closingRow.getCell(7).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: `FF${data.closingBalance >= 0 ? RECEIVABLE_FILL : PAYABLE_FILL}`,
    },
  };

  sheet.columns = [
    { width: 14 },
    { width: 28 },
    { width: 20 },
    { width: 18 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
  ];

  return workbook.xlsx.writeBuffer();
}

export function buildAktSverkaPdf(data: AktSverkaData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fillColor(`#${BRAND_COLOR}`)
      .fontSize(18)
      .text("Akt Sverka", { align: "left" });
    doc
      .fillColor("#333333")
      .fontSize(11)
      .text(`Klient: ${data.clientName}`)
      .text(`Davr: ${data.periodStart} — ${data.periodEnd}`)
      .moveDown(0.5);

    doc
      .fontSize(11)
      .fillColor("#000000")
      .text(`Boshlang'ich qoldiq: ${data.openingBalance.toFixed(2)}`, {
        underline: false,
      });
    doc.moveDown(0.5);

    const colX = [40, 110, 260, 350, 430, 490, 550];
    const colW = [70, 150, 90, 80, 60, 60, 0];
    const headers = [
      "Sana",
      "Izoh",
      "Mas'ul shaxs",
      "To'lov turi",
      "Debet",
      "Kredit",
      "Qoldiq",
    ];

    function drawHeader(y: number): void {
      doc.fontSize(9).fillColor("#FFFFFF");
      doc.rect(40, y, 555 - 40, 18).fill(`#${HEADER_FILL}`);
      doc.fillColor("#FFFFFF");
      headers.forEach((h, i) => {
        doc.text(h, colX[i] + 2, y + 5, { width: colW[i] || 60 });
      });
    }

    let y = doc.y + 5;
    drawHeader(y);
    y += 20;

    doc.fontSize(9).fillColor("#000000");
    for (const r of data.rows) {
      if (y > 760) {
        doc.addPage();
        y = 40;
        drawHeader(y);
        y += 20;
        doc.fillColor("#000000");
      }
      const values = [
        r.date,
        r.comment ?? "",
        r.responsiblePerson,
        paymentTypeLabel[r.paymentType] ?? r.paymentType,
        r.debit ? r.debit.toFixed(2) : "",
        r.credit ? r.credit.toFixed(2) : "",
        r.balance.toFixed(2),
      ];
      values.forEach((v, i) => {
        doc.text(v, colX[i] + 2, y, { width: colW[i] || 60 });
      });
      doc
        .moveTo(40, y + 14)
        .lineTo(555, y + 14)
        .strokeColor("#EEEEEE")
        .stroke();
      y += 16;
    }

    y += 10;
    doc
      .fontSize(11)
      .fillColor("#000000")
      .text(`Yakuniy qoldiq: ${data.closingBalance.toFixed(2)}`, 40, y, {
        underline: true,
      });

    doc.end();
  });
}
