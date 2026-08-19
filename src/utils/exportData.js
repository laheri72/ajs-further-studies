import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Exports data array to MS Excel (.xlsx) workbook file.
 * @param {string} filename Base filename without extension
 * @param {string} sheetName Name of the worksheet
 * @param {Array<{key: string, label: string}>} columns Column definitions
 * @param {Array<Object>} rows Data rows
 */
export function exportToExcel(filename, sheetName, columns, rows) {
  if (!rows || !rows.length) return;

  const formattedRows = rows.map((row) => {
    const obj = {};
    columns.forEach((col) => {
      let val = row[col.key];
      if (Array.isArray(val)) val = val.join(', ');
      else if (val === null || val === undefined) val = '-';
      obj[col.label] = val;
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // Set column widths dynamically
  const colWidths = columns.map((col) => {
    const maxLen = Math.max(
      col.label.length,
      ...rows.map((r) => {
        const val = r[col.key];
        if (Array.isArray(val)) return val.join(', ').length;
        return String(val || '').length;
      }),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'Data Report');
  XLSX.writeFile(workbook, `${filename}_${formatDateSuffix()}.xlsx`);
}

/**
 * Exports data to an institutional styled PDF document (.pdf).
 * @param {string} filename Base filename without extension
 * @param {string} reportTitle Main title displayed on report header
 * @param {Array<{key: string, label: string}>} columns Column definitions
 * @param {Array<Object>} rows Data rows
 */
export function exportToPDF(filename, reportTitle, columns, rows) {
  if (!rows || !rows.length) return;

  const isLandscape = columns.length > 5;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Institutional Header Banner (Dark Forest Green #062319)
  doc.setFillColor(6, 35, 25);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Title in Antique Gold (#c8a84e)
  doc.setTextColor(200, 168, 78);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Imtehanaat-Ukhra — External Examinations Portal', 20, 32);

  // Subheader title
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle || 'Official Administrative Audit Report', 20, 72);

  // Timestamp & Metadata
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 110, 110);
  const metadataStr = `Generated: ${new Date().toLocaleString()}   |   Total Records: ${rows.length}`;
  doc.text(metadataStr, 20, 86);

  // Table Body Data
  const head = [columns.map((col) => col.label)];
  const body = rows.map((row) =>
    columns.map((col) => {
      let val = row[col.key];
      if (Array.isArray(val)) return val.join(', ');
      if (val === null || val === undefined) return '-';
      return String(val);
    }),
  );

  autoTable(doc, {
    startY: 98,
    head: head,
    body: body,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: [40, 40, 40],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [6, 35, 25],
      textColor: [200, 168, 78],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    margin: { top: 98, bottom: 40, left: 20, right: 20 },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} — Imtehanaat-Ukhra Official Document`,
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' },
      );
    },
  });

  doc.save(`${filename}_${formatDateSuffix()}.pdf`);
}

function formatDateSuffix() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}
