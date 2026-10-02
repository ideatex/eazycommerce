/**
 * Minimal single/multi-page PDF writer for tax invoices (text only, Helvetica).
 * No external dependency; output is a valid PDF 1.4 document.
 */

export interface InvoiceData {
  invoiceNumber: string;
  issuedAt: Date;
  orderNumber: string;
  business: { name: string; legalName?: string | null; gstin?: string | null; address?: string | null; city?: string | null; state?: string | null; postalCode?: string | null };
  customer: { name: string; email: string; phone?: string | null };
  shippingAddress: string[];
  items: Array<{ title: string; sku?: string | null; quantity: number; unitPrice: number; taxRatePercent: number; totalPrice: number }>;
  totals: { subtotal: number; discountTotal: number; cgstTotal: number; sgstTotal: number; igstTotal: number; shippingFee: number; grandTotal: number };
  paymentMethod: string;
  paymentStatus: string;
  currencySymbol: string;
}

// Helvetica only covers WinAnsi, so the rupee sign is spelled out.
const money = (symbol: string, n: number) =>
  `${symbol === "₹" ? "Rs." : symbol} ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function esc(s: string): string {
  return s
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;

export function buildInvoicePdf(inv: InvoiceData): Buffer {
  const pages: string[][] = [[]];
  let y = PAGE_H - MARGIN;

  const cur = () => pages[pages.length - 1];
  const text = (x: number, yy: number, str: string, size = 10, bold = false) => {
    cur().push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${yy} Td (${esc(str)}) Tj ET`);
  };
  const rightText = (xRight: number, yy: number, str: string, size = 10, bold = false) => {
    const approx = str.length * size * 0.5;
    text(Math.max(MARGIN, xRight - approx), yy, str, size, bold);
  };
  const line = (yy: number) => cur().push(`0.8 G ${MARGIN} ${yy} m ${PAGE_W - MARGIN} ${yy} l S`);
  const newPage = () => {
    pages.push([]);
    y = PAGE_H - MARGIN;
  };
  const ensure = (needed: number) => {
    if (y - needed < MARGIN + 20) newPage();
  };

  const sym = inv.currencySymbol;
  text(MARGIN, y, "TAX INVOICE", 18, true);
  y -= 22;
  text(MARGIN, y, inv.business.legalName || inv.business.name, 11, true);
  y -= 14;
  const bizAddr = [inv.business.address, inv.business.city, inv.business.state, inv.business.postalCode].filter(Boolean).join(", ");
  if (bizAddr) { text(MARGIN, y, bizAddr, 9); y -= 12; }
  if (inv.business.gstin) { text(MARGIN, y, `GSTIN: ${inv.business.gstin}`, 9); y -= 12; }

  rightText(PAGE_W - MARGIN, PAGE_H - MARGIN, `Invoice No: ${inv.invoiceNumber}`, 10, true);
  rightText(PAGE_W - MARGIN, PAGE_H - MARGIN - 14, `Date: ${inv.issuedAt.toISOString().slice(0, 10)}`, 10);
  rightText(PAGE_W - MARGIN, PAGE_H - MARGIN - 28, `Order: ${inv.orderNumber}`, 10);

  y -= 10;
  line(y);
  y -= 16;
  text(MARGIN, y, "Bill to / Ship to", 9, true);
  y -= 13;
  text(MARGIN, y, inv.customer.name, 10, true);
  y -= 12;
  text(MARGIN, y, inv.customer.email + (inv.customer.phone ? `  |  ${inv.customer.phone}` : ""), 9);
  y -= 12;
  for (const l of inv.shippingAddress) { text(MARGIN, y, l, 9); y -= 12; }

  y -= 8;
  line(y);
  y -= 14;
  const cols = { item: MARGIN, qty: 330, rate: 400, tax: 450, amount: PAGE_W - MARGIN };
  text(cols.item, y, "Item", 9, true);
  rightText(cols.qty + 20, y, "Qty", 9, true);
  rightText(cols.rate + 30, y, "Rate", 9, true);
  rightText(cols.tax + 25, y, "GST", 9, true);
  rightText(cols.amount, y, "Amount", 9, true);
  y -= 6;
  line(y);
  y -= 14;

  for (const item of inv.items) {
    ensure(26);
    const title = item.title.length > 48 ? `${item.title.slice(0, 45)}...` : item.title;
    text(cols.item, y, title, 9);
    rightText(cols.qty + 20, y, String(item.quantity), 9);
    rightText(cols.rate + 30, y, money(sym, item.unitPrice), 9);
    rightText(cols.tax + 25, y, `${item.taxRatePercent}%`, 9);
    rightText(cols.amount, y, money(sym, item.totalPrice), 9);
    y -= 12;
    if (item.sku) { text(cols.item, y, `SKU ${item.sku}`, 7); y -= 11; }
  }

  ensure(120);
  y -= 4;
  line(y);
  y -= 16;
  const row = (label: string, value: string, bold = false) => {
    text(350, y, label, 10, bold);
    rightText(cols.amount, y, value, 10, bold);
    y -= 14;
  };
  row("Subtotal", money(sym, inv.totals.subtotal));
  if (inv.totals.discountTotal > 0) row("Discount", `- ${money(sym, inv.totals.discountTotal)}`);
  if (inv.totals.cgstTotal > 0) row("CGST", money(sym, inv.totals.cgstTotal));
  if (inv.totals.sgstTotal > 0) row("SGST", money(sym, inv.totals.sgstTotal));
  if (inv.totals.igstTotal > 0) row("IGST", money(sym, inv.totals.igstTotal));
  row("Shipping", money(sym, inv.totals.shippingFee));
  row("Grand total", money(sym, inv.totals.grandTotal), true);
  y -= 6;
  text(MARGIN, y, `Payment: ${inv.paymentMethod} (${inv.paymentStatus})`, 9);
  y -= 24;
  text(MARGIN, y, "This is a computer-generated invoice.", 8);

  // ---- assemble PDF objects
  const objects: string[] = [];
  const add = (body: string) => { objects.push(body); return objects.length; };

  const catalogId = add("");
  const pagesId = add("");
  const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  const pageIds: number[] = [];
  for (const ops of pages) {
    const stream = ops.join("\n");
    const contentId = add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
    const pageId = add(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  }
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefAt = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}
