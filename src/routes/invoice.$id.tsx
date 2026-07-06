import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { SHIPMENT } from "@/lib/shipment-data";
import {
  ChevronRight, ChevronLeft, Download,
  ZoomIn, ZoomOut, FileText, CheckCircle2, XCircle, Check, Clock,
  Webhook, FileDown, ScanText, GitCompareArrows, Landmark, PackageCheck, UserCheck, ShieldCheck, Server,
  ChevronDown, Pencil, Trash2, Plus, ChevronsLeft, ChevronsRight, RotateCcw, AlertTriangle, Inbox,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/invoice/$id")({
  component: InvoiceDetailPage,
});

type MainTab = "Information" | "Matching" | "Activity";
type InfoTab = "Invoice" | "Purchase Order" | "Sales Contract" | "Bill of Lading" | "Customs Declaration";
type StageTab = "Stage 1" | "Stage 2" | "Stage 3";
type DeclarationVariant = "Original" | "Adjusted";
type DocSetStatus = "Approved" | "Pending" | "Rejected";
type PhaseState = { status: DocSetStatus; reason?: string };
type ActivityEvent = { date: string; t: string; icon: LucideIcon; title: string; who: string; desc: string };
const CURRENT_USER = "Nguyen Thi Lan · Finance Manager";

type FieldRow = { key: string; value: string; wide?: boolean; mono?: boolean };
type ItemRow = { id: number; productName: string; qty: string; uom: string; unitPrice: string; currency?: string; lineAmount: string };
type GoodsRow = { id: number; description: string; netWeight: string; grossWeight: string };
type EditableInfoTab = Exclude<InfoTab, "Customs Declaration">;
type DocData = { header: FieldRow[]; bank?: FieldRow[]; items?: ItemRow[]; goods?: GoodsRow[] };

type SingularInfoTab = "Invoice" | "Bill of Lading";
type LinkedDocRecord = { id: string; label: string; fileUrl: string | null; data: DocData };

type StageDoc = { label: string; docNo: string; qty?: string; unitPrice?: string; lineAmount?: string };
type ItemMatchLine = {
  id: number;
  itemCode: string;
  productName: string;
  uom: string;
  qty: string;
  unitPrice: string;
  lineAmount: string;
  matchedDocs: Record<StageTab, StageDoc[]>;
};
type StageBanner = { text: string; tone: "success" | "pending" | "notStarted" };
type CustomsItemRow = {
  hsCode: string; description: string; qty: string; uom: string; unitPrice: string;
  invoiceValue: string; taxableValueVnd: string; importTaxPct: string; importTaxVnd: string; vatPct: string; vatVnd: string;
};

type InvoiceProfile = {
  stage: StageTab;
  infoData: Record<SingularInfoTab, DocData>;
  purchaseOrders: LinkedDocRecord[];
  salesContracts: LinkedDocRecord[];
  customsHeaderFields: FieldRow[];
  customsItems: CustomsItemRow[];
  pdfMap: Record<"Invoice" | "Bill of Lading" | "Customs Declaration", string>;
  stageDocs: Record<StageTab, StageDoc[]>;
  stageBanners: Record<StageTab, StageBanner[]>;
  stageComplete: Record<StageTab, boolean>;
  headerMatchRows: string[][];
  itemMatchLines: ItemMatchLine[];
  activityEvents: ActivityEvent[];
  activityHeaderLabel: string;
  approverName: string;
  approverTime: string;
};

function sumItemAmounts(items: ItemRow[]): string {
  const total = items.reduce((acc, r) => acc + (parseFloat(r.lineAmount.replace(/,/g, "")) || 0), 0);
  return total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sumFormatted(values: string[], decimals: number): string {
  const total = values.reduce((acc, v) => acc + (parseFloat(v.replace(/,/g, "")) || 0), 0);
  return total.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function isoToDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mi = parseInt(m, 10) - 1;
  if (!y || !m || !d || mi < 0 || mi > 11) return iso;
  return `${d}-${months[mi]}-${y}`;
}

const INVOICE_PROFILES: Record<string, InvoiceProfile> = {
  // ---- Qinhuangdao Lihua Starch (LH261730) — moved in verbatim from the original module-level constants ----
  LH261730: {
    stage: "Stage 3",
    infoData: {
      "Invoice": {
        header: [
          { key: "Invoice Number", value: "LH261730" },
          { key: "Invoice Date", value: "2026-04-05" },
          { key: "Order Number", value: "26030025" },
          { key: "Vendor Name", value: "QINHUANGDAO LIHUA STARCH CO., LTD." },
          { key: "Buyer Name", value: "ASIA CHEMICAL CORPORATION" },
          { key: "Currency", value: "USD" },
          { key: "Incoterms", value: "CIF" },
          { key: "Delivery Place", value: "HAIPHONG, VIETNAM" },
          { key: "Payment Term", value: "TT 30 DAYS FROM B/L DATE" },
          { key: "Total Amount", value: "25,575.00" },
          { key: "Total Quantity", value: "55" },
          { key: "Quantity UoM", value: "MTS" },
          { key: "Net Weight", value: "55,220" },
          { key: "Transport Mode", value: "SEA" },
          { key: "Shipment Route", value: "JINGTANG PORT, CHINA -> HAIPHONG, VIETNAM", wide: true },
        ],
        bank: [
          { key: "Beneficiary Name", value: "QINHUANGDAO LIHUA STARCH CO., LTD.", wide: true },
          { key: "Bank Name", value: "INDUSTRIAL AND COMMERCIAL BANK OF CHINA - QINHUANGDAO BRANCH FUNING SUB-BRANCH", wide: true },
          { key: "SWIFT/BIC", value: "ICBKCNBJQHD" },
          { key: "Bank Account", value: "0404012009300047288" },
        ],
        items: [
          { id: 1, productName: "DEXTROSE MONOHYDRATE FOOD GRADE", qty: "55", uom: "MTS", unitPrice: "465.00", lineAmount: "25,575.00" },
        ],
      },
      "Bill of Lading": {
        header: [
          { key: "B/L Number", value: "JTHPH26S03802", mono: true },
          { key: "Transport Mode", value: "SEA" },
          { key: "Shipper Name", value: "QINHUANGDAO LIHUA STARCH CO., LTD." },
          { key: "Shipper Address", value: "No.89, Lihua Street, Funing District, Qinhuangdao City, Hebei Province, China", wide: true },
          { key: "Consignee Name", value: "ASIA CHEMICAL CORPORATION" },
          { key: "Consignee Address", value: "Lot K4B, Le Minh Xuan Industrial Zone, Road No.4, Binh Loi Commune, Ho Chi Minh City, Vietnam", wide: true },
          { key: "Notify Party", value: "SAME AS CONSIGNEE" },
          { key: "Vessel / Voyage", value: "LIANG XIANG 82 / 2606S" },
          { key: "Place of Receipt", value: "JINGTANG PORT, CHINA" },
          { key: "Port of Loading", value: "JINGTANG PORT, CHINA" },
          { key: "Port of Discharge", value: "HAIPHONG, VIETNAM" },
          { key: "Place of Delivery", value: "HAIPHONG, VIETNAM" },
          { key: "Incoterms", value: "—" },
          { key: "Freight Term", value: "FREIGHT PREPAID" },
          { key: "Laden On Board", value: "2026-04-14" },
          { key: "B/L Issue", value: "2026-04-14" },
          { key: "Gross Weight", value: "55,220 KGS" },
          { key: "Measurement", value: "100 CBM" },
          { key: "Total Packages", value: "2,200 BAGS" },
          { key: "Country of Origin", value: "China" },
        ],
        goods: [
          { id: 1, description: "DEXTROSE MONOHYDRATE FOOD GRADE", netWeight: "—", grossWeight: "55,220 KGS" },
        ],
      },
    },
    purchaseOrders: [
      {
        id: "po-1",
        label: "26030025",
        fileUrl: "/pdfs/Purchase_Order_Qinhuangdao Lihua.pdf",
        data: {
          header: [
            { key: "PO Number", value: "26030025" },
            { key: "PO Date", value: "2026-03-02" },
            { key: "Buyer Name", value: "ASIA CHEMICAL CORPORATION" },
            { key: "Buyer Tax Code", value: "0304918352" },
            { key: "Seller Name", value: "Qinhuangdao Lihua Starch Co., Ltd." },
            { key: "Seller Code", value: "30100108" },
            { key: "Currency", value: "USD" },
            { key: "Incoterm", value: "CIF" },
            { key: "Incoterm Location", value: "HAI PHONG" },
            { key: "Shipment Mode", value: "SEA" },
            { key: "Port of Discharge", value: "DINH VU PORT" },
            { key: "Payment Term", value: "TT 30 days from B/L date" },
            { key: "Requested ETD", value: "2026-04-09" },
            { key: "Total Quantity", value: "55,000" },
            { key: "Total Amount", value: "25,575.00" },
          ],
          bank: [
            { key: "Beneficiary Name", value: "QINHUANGDAO LIHUA STARCH CO., LTD.", wide: true },
            { key: "Bank Name", value: "Industrial And Commercial Bank of China - Qingdao Branch, Funing Sub-Branch", wide: true },
            { key: "SWIFT/BIC", value: "ICBKCNBJQHD" },
            { key: "Bank Account", value: "0404012009300047288" },
          ],
          items: [
            { id: 1, productName: "Dextrose Monohydrate - Lihua", qty: "55,000", uom: "KG", unitPrice: "0.4650", currency: "USD", lineAmount: "25,575.00" },
          ],
        },
      },
    ],
    salesContracts: [],
    customsHeaderFields: [
      { key: "Declaration Number", value: "108189893450", mono: true },
      { key: "Type Code", value: "A11" },
      { key: "Registration Date", value: "2026-04-28 10:11:38" },
      { key: "Importer Name", value: "ASIA CHEMICAL CORPORATION", wide: true },
      { key: "Importer Tax Code", value: "0304918352" },
      { key: "Exporter Name", value: "QINHUANGDAO LIHUA STARCH CO., LTD.", wide: true },
      { key: "Exporter Country", value: "CN" },
      { key: "B/L Number", value: "JTHPH26S03802" },
      { key: "Invoice Number", value: "LH261730" },
      { key: "Invoice Issue Date", value: "2026-04-05" },
      { key: "Invoice Value", value: "25,575.00 USD" },
      { key: "Incoterms", value: "CIF" },
      { key: "Payment Method", value: "KC" },
      { key: "Payment Term", value: "T/T" },
      { key: "Gross Weight", value: "55,220 KGM" },
      { key: "Cargo Arrival Date", value: "2026-04-25" },
      { key: "Exchange Rate", value: "26,130" },
      { key: "Transport Means", value: "HE SHENG 2606S" },
      { key: "Loading Location", value: "JINGTANG" },
      { key: "Unloading Location", value: "DINH VU NAM HAI" },
      { key: "Taxable Value Total", value: "668,274,750 VND" },
      { key: "VAT Amount Total", value: "53,461,980 VND" },
    ],
    customsItems: [
      { hsCode: "17023010", description: "DEXTROSE MONOHYDRATE", qty: "55,000", uom: "KGM", unitPrice: "0.465", invoiceValue: "25,575.00", taxableValueVnd: "668,274,750", importTaxPct: "0", importTaxVnd: "0", vatPct: "8", vatVnd: "53,461,980" },
    ],
    pdfMap: {
      "Invoice": "/pdfs/Invoice_Qinhuangdao Lihua.pdf",
      "Bill of Lading": "/pdfs/Bill_of_Lading_Qinhuangdao Lihua.pdf",
      "Customs Declaration": "/pdfs/Customs_Declaration_Qinhuangdao Lihua.pdf",
    },
    stageDocs: {
      "Stage 1": [
        { label: "Purchase Order", docNo: SHIPMENT.poNo },
        { label: "Bill of Lading", docNo: SHIPMENT.blNo },
      ],
      "Stage 2": [
        { label: "Purchase Order", docNo: SHIPMENT.poNo },
        { label: "Bill of Lading", docNo: SHIPMENT.blNo },
        { label: "Customs Declaration", docNo: SHIPMENT.customsNo },
      ],
      "Stage 3": [
        { label: "Purchase Order", docNo: SHIPMENT.poNo },
        { label: "Bill of Lading", docNo: SHIPMENT.blNo },
        { label: "Customs Declaration", docNo: SHIPMENT.customsNo },
        { label: "Goods Receipt", docNo: SHIPMENT.grNo },
      ],
    },
    stageBanners: {
      "Stage 1": [
        { text: "Matching Stage 1 completed — Invoice ↔ PO ↔ Contract ↔ BL reconciled. 100% matched.", tone: "success" },
        { text: "Tran Van Minh confirmed at 08:25 on 30-Apr-2026", tone: "success" },
      ],
      "Stage 2": [
        { text: "Matching Stage 2 completed — Customs Declaration added. All header + item lines matched.", tone: "success" },
        { text: "Tran Van Minh confirmed at 10:25 on 03-May-2026", tone: "success" },
      ],
      "Stage 3": [
        { text: "Matching Stage 3 completed — 5-Way match closed with zero variance.", tone: "success" },
      ],
    },
    stageComplete: { "Stage 1": true, "Stage 2": true, "Stage 3": true },
    headerMatchRows: [
      ["Vendor", "Lihua Starch", "Lihua Starch", "Lihua Starch", "Lihua Starch", "Lihua Starch", "Lihua Starch"],
      ["Buyer / Consignee", "Asia Chemical", "Asia Chemical", "Asia Chemical", "Asia Chemical", "Asia Chemical", "Asia Chemical"],
      ["PO Number", SHIPMENT.poNo, SHIPMENT.poNo, "—", "—", "—", SHIPMENT.poNo],
      ["Currency", "USD", "USD", "USD", "—", "USD", "USD"],
      ["Incoterm", "CIF Hai Phong", "CIF Hai Phong", "CIF Hai Phong", "—", "CIF", "—"],
      ["Payment Term", "TT 30D BL", "TT 30D BL", "TT 30D BL", "—", "—", "—"],
      ["Bank", "BOC Qinhuangdao", "BOC Qinhuangdao", "—", "—", "—", "—"],
      ["Shipment / Vessel", "HE SHENG 2606S", "—", "—", "HE SHENG 2606S", "HE SHENG 2606S", "—"],
      ["Container", "2 x 40HC", "—", "—", "2 x 40HC", "2 x 40HC", "—"],
      ["Invoice Amount", "25,575.00 USD", "25,575.00 USD", "25,575.00 USD", "—", "25,575.00 USD", "—"],
    ],
    itemMatchLines: [
      {
        id: 1, itemCode: "DEX-FG-001", productName: SHIPMENT.product, uom: "MTS", qty: "55,000", unitPrice: "465.00", lineAmount: SHIPMENT.amount,
        matchedDocs: {
          "Stage 1": [
            { label: "Purchase Order", docNo: SHIPMENT.poNo, qty: "55,000", unitPrice: "465.00", lineAmount: SHIPMENT.amount },
            { label: "Bill of Lading", docNo: SHIPMENT.blNo, qty: "55,000", unitPrice: "465.00", lineAmount: SHIPMENT.amount },
          ],
          "Stage 2": [
            { label: "Purchase Order", docNo: SHIPMENT.poNo, qty: "55,000", unitPrice: "465.00", lineAmount: SHIPMENT.amount },
            { label: "Bill of Lading", docNo: SHIPMENT.blNo, qty: "55,000", unitPrice: "465.00", lineAmount: SHIPMENT.amount },
            { label: "Customs Declaration", docNo: SHIPMENT.customsNo, qty: "55,000", unitPrice: "465.00", lineAmount: SHIPMENT.amount },
          ],
          "Stage 3": [
            { label: "Purchase Order", docNo: SHIPMENT.poNo, qty: "55,000", unitPrice: "465.00", lineAmount: SHIPMENT.amount },
            { label: "Bill of Lading", docNo: SHIPMENT.blNo, qty: "55,000", unitPrice: "465.00", lineAmount: SHIPMENT.amount },
            { label: "Customs Declaration", docNo: SHIPMENT.customsNo, qty: "55,000", unitPrice: "465.00", lineAmount: SHIPMENT.amount },
            { label: "Goods Receipt", docNo: SHIPMENT.grNo, qty: "55,000", unitPrice: "465.00", lineAmount: SHIPMENT.amount },
          ],
        },
      },
    ],
    activityEvents: [
      { date: "30-Apr", t: "08:10", icon: Webhook, title: "Webhook received", who: "System · Impex Portal", desc: "Inbound shipment notification LH261730 received via webhook." },
      { date: "30-Apr", t: "08:11", icon: FileDown, title: "Commercial Invoice synchronized", who: "System", desc: "Invoice document downloaded from vendor portal." },
      { date: "30-Apr", t: "08:11", icon: FileDown, title: "Sales Contract synchronized", who: "System", desc: "Contract 26030025 attached to invoice." },
      { date: "30-Apr", t: "08:12", icon: FileDown, title: "Bill of Lading synchronized", who: "System · Freight Forwarder", desc: "BL JTHPH26S03802 received." },
      { date: "30-Apr", t: "08:12", icon: FileDown, title: "Customs Declaration synchronized", who: "System · VNACCS", desc: "Customs declaration 105678923420 linked." },
      { date: "30-Apr", t: "08:15", icon: ScanText, title: "OCR completed", who: "System · OCR Engine v3.1", desc: "Structured extraction on 5 documents · 214 fields captured." },
      { date: "30-Apr", t: "08:18", icon: GitCompareArrows, title: "Matching Stage 1 completed", who: "System", desc: "Invoice ↔ PO ↔ Contract ↔ BL reconciled. 100% matched." },
      { date: "30-Apr", t: "08:20", icon: Landmark, title: "Matching Stage 2 completed", who: "System", desc: "Customs Declaration added. All header + item lines matched." },
      { date: "30-Apr", t: "08:23", icon: PackageCheck, title: "Goods Receipt synchronized", who: "System · SAP MM", desc: "GR 5000335133 posted for 55,000 KG." },
      { date: "30-Apr", t: "08:24", icon: GitCompareArrows, title: "Matching Stage 3 completed", who: "System", desc: "5-Way match closed with zero variance." },
      { date: "30-Apr", t: "08:25", icon: UserCheck, title: "Merchandise confirmed", who: "Tran Van Minh · Merchandise", desc: "Quantities and quality verified against GR." },
      { date: "30-Apr", t: "08:28", icon: ShieldCheck, title: "Finance approved", who: "Nguyen Thi Lan · Finance Manager", desc: "Approved for ERP posting. Payment scheduled 14-May-2026." },
      { date: "30-Apr", t: "08:29", icon: Server, title: "ERP posting completed", who: "System · SAP FI", desc: "Document 5105003321 posted to company code 1000." },
    ],
    activityHeaderLabel: "30-Apr-2026 · {n} events",
    approverName: "Tran Van Minh",
    approverTime: "08:25",
  },

  // ---- Nikken Foods (A03680) — 1 invoice ↔ 3 POs, 0 Sales Contracts, mid-reconciliation at Stage 2 ----
  A03680: {
    stage: "Stage 2",
    infoData: {
      "Invoice": {
        header: [
          { key: "Invoice Number", value: "A03680" },
          { key: "Invoice Date", value: "2026-03-02" },
          { key: "Order Number", value: "26010550, 26010785, 26020191" },
          { key: "Vendor Name", value: "NIKKEN FOODS CO., LTD." },
          { key: "Buyer Name", value: "ASIA CHEMICAL CORPORATION" },
          { key: "Currency", value: "USD" },
          { key: "Incoterms", value: "CIF" },
          { key: "Delivery Place", value: "HO CHI MINH CITY, VIETNAM" },
          { key: "Payment Term", value: "T/T 60 DAYS AFTER B/L DATE" },
          { key: "Total Amount", value: "24,322.00" },
          { key: "Total Quantity", value: "4,520" },
          { key: "Quantity UoM", value: "KGS" },
          { key: "Net Weight", value: "4,520" },
          { key: "Transport Mode", value: "SEA" },
          { key: "Shipment Route", value: "YOKOHAMA, JAPAN -> HO CHI MINH CITY, VIETNAM", wide: true },
        ],
        bank: [
          { key: "Beneficiary Name", value: "NIKKEN FOODS CO., LTD.", wide: true },
          { key: "Bank Name", value: "MIZUHO BANK LTD, HAMAMATSU BRANCH", wide: true },
          { key: "SWIFT/BIC", value: "MHCBJPJT" },
          { key: "Bank Account", value: "1165949" },
        ],
        items: [
          { id: 1, productName: "VEGETABLE POWDER P007", qty: "4,000", uom: "KG", unitPrice: "5.25", lineAmount: "21,000.00" },
          { id: 2, productName: "SOY SAUCE POWDER A6016", qty: "500", uom: "KG", unitPrice: "6.30", lineAmount: "3,150.00" },
          { id: 3, productName: "MEAT SEASONING A6391", qty: "20", uom: "KG", unitPrice: "8.60", lineAmount: "172.00" },
        ],
      },
      "Bill of Lading": {
        header: [
          { key: "B/L Number", value: "YOKDKK23592", mono: true },
          { key: "Transport Mode", value: "SEA" },
          { key: "Shipper Name", value: "NIKKEN FOODS CO., LTD." },
          { key: "Shipper Address", value: "Marukashiwa Bldg. 8F, 1-6-1 Nihonbashi Honcho, Chuo-ku, Tokyo 103-0023, Japan", wide: true },
          { key: "Consignee Name", value: "ASIA CHEMICAL CORPORATION" },
          { key: "Consignee Address", value: "Lot K4B, Le Minh Xuan Industrial Zone, Road No.4, Binh Loi Commune, Ho Chi Minh City, Vietnam", wide: true },
          { key: "Notify Party", value: "SAME AS CONSIGNEE" },
          { key: "Vessel / Voyage", value: "ADDISON / 050S" },
          { key: "Place of Receipt", value: "YOKOHAMA, CY" },
          { key: "Port of Loading", value: "YOKOHAMA, JAPAN" },
          { key: "Port of Discharge", value: "CAI MEP, VIETNAM" },
          { key: "Place of Delivery", value: "HO CHI MINH CITY, CY" },
          { key: "Incoterms", value: "—" },
          { key: "Freight Term", value: "FREIGHT PREPAID AS ARRANGED" },
          { key: "Laden On Board", value: "2026-03-12" },
          { key: "B/L Issue", value: "2026-03-12" },
          { key: "Gross Weight", value: "4,713.00 KG" },
          { key: "Measurement", value: "14.439 M3" },
          { key: "Total Packages", value: "13 PACKAGES" },
          { key: "Country of Origin", value: "Japan" },
        ],
        goods: [
          { id: 1, description: "NATURAL FLAVORS (VEGETABLE POWDER P007 / SOY SAUCE POWDER A6016 / MEAT SEASONING A6391)", netWeight: "4,520 KGS", grossWeight: "4,713.00 KG" },
        ],
      },
    },
    purchaseOrders: [
      {
        id: "po-1",
        label: "26010550",
        fileUrl: "/pdfs/Purchase_Order_Nikken_26010550.pdf",
        data: {
          header: [
            { key: "PO Number", value: "26010550" },
            { key: "PO Date", value: "2026-01-20" },
            { key: "Buyer Name", value: "ASIA CHEMICAL CORPORATION" },
            { key: "Buyer Tax Code", value: "0304918352" },
            { key: "Seller Name", value: "Nikken Foods Co., Ltd." },
            { key: "Seller Code", value: "30100030" },
            { key: "Currency", value: "USD" },
            { key: "Incoterm", value: "CIF" },
            { key: "Incoterm Location", value: "HO CHI MINH" },
            { key: "Shipment Mode", value: "SEA" },
            { key: "Port of Discharge", value: "CAT LAI PORT" },
            { key: "Payment Term", value: "TT 60 days from B/L date" },
            { key: "Requested ETD", value: "2026-03-09" },
            { key: "Total Quantity", value: "4,000" },
            { key: "Total Amount", value: "21,000.00" },
          ],
          bank: [
            { key: "Beneficiary Name", value: "NIKKEN FOODS CO., LTD.", wide: true },
            { key: "Bank Name", value: "MIZUHO BANK LTD, HAMAMATSU BRANCH", wide: true },
            { key: "SWIFT/BIC", value: "MHCBJPJT" },
            { key: "Bank Account", value: "1165949" },
          ],
          items: [
            { id: 1, productName: "Vegetable Powder P007", qty: "4,000", uom: "KG", unitPrice: "5.2500", currency: "USD", lineAmount: "21,000.00" },
          ],
        },
      },
      {
        id: "po-2",
        label: "26010785",
        fileUrl: "/pdfs/Purchase_Order_Nikken_26010785.pdf",
        data: {
          header: [
            { key: "PO Number", value: "26010785" },
            { key: "PO Date", value: "2026-01-26" },
            { key: "Buyer Name", value: "ASIA CHEMICAL CORPORATION" },
            { key: "Buyer Tax Code", value: "0304918352" },
            { key: "Seller Name", value: "Nikken Foods Co., Ltd." },
            { key: "Seller Code", value: "30100030" },
            { key: "Currency", value: "USD" },
            { key: "Incoterm", value: "CIF" },
            { key: "Incoterm Location", value: "HO CHI MINH" },
            { key: "Shipment Mode", value: "SEA" },
            { key: "Port of Discharge", value: "CAT LAI PORT" },
            { key: "Payment Term", value: "TT 60 days from B/L date" },
            { key: "Requested ETD", value: "2026-03-09" },
            { key: "Total Quantity", value: "500" },
            { key: "Total Amount", value: "3,150.00" },
          ],
          bank: [
            { key: "Beneficiary Name", value: "NIKKEN FOODS CO., LTD.", wide: true },
            { key: "Bank Name", value: "MIZUHO BANK LTD, HAMAMATSU BRANCH", wide: true },
            { key: "SWIFT/BIC", value: "MHCBJPJT" },
            { key: "Bank Account", value: "1165949" },
          ],
          items: [
            { id: 1, productName: "Soy Sauce Powder A6016", qty: "500", uom: "KG", unitPrice: "6.3000", currency: "USD", lineAmount: "3,150.00" },
          ],
        },
      },
      {
        id: "po-3",
        label: "26020191",
        fileUrl: "/pdfs/Purchase_Order_Nikken_26020191.pdf",
        data: {
          header: [
            { key: "PO Number", value: "26020191" },
            { key: "PO Date", value: "2026-02-09" },
            { key: "Buyer Name", value: "ASIA CHEMICAL CORPORATION" },
            { key: "Buyer Tax Code", value: "0304918352" },
            { key: "Seller Name", value: "Nikken Foods Co., Ltd." },
            { key: "Seller Code", value: "30100030" },
            { key: "Currency", value: "USD" },
            { key: "Incoterm", value: "CIF" },
            { key: "Incoterm Location", value: "HO CHI MINH" },
            { key: "Shipment Mode", value: "SEA" },
            { key: "Port of Discharge", value: "CAT LAI PORT" },
            { key: "Payment Term", value: "TT 60 days from B/L date" },
            { key: "Requested ETD", value: "2026-03-09" },
            { key: "Total Quantity", value: "20" },
            { key: "Total Amount", value: "172.00" },
          ],
          bank: [
            { key: "Beneficiary Name", value: "NIKKEN FOODS CO., LTD.", wide: true },
            { key: "Bank Name", value: "MIZUHO BANK LTD, HAMAMATSU BRANCH", wide: true },
            { key: "SWIFT/BIC", value: "MHCBJPJT" },
            { key: "Bank Account", value: "1165949" },
          ],
          items: [
            { id: 1, productName: "Meat Seasoning A6391", qty: "20", uom: "KG", unitPrice: "8.6000", currency: "USD", lineAmount: "172.00" },
          ],
        },
      },
    ],
    salesContracts: [],
    customsHeaderFields: [
      { key: "Declaration Number", value: "108114267810", mono: true },
      { key: "Type Code", value: "A11" },
      { key: "Registration Date", value: "2026-04-02 20:22:03" },
      { key: "Importer Name", value: "CÔNG TY CỔ PHẦN HÓA CHẤT Á CHÂU", wide: true },
      { key: "Importer Tax Code", value: "0304918352" },
      { key: "Exporter Name", value: "NIKKEN FOODS CO., LTD.", wide: true },
      { key: "Exporter Country", value: "JP" },
      { key: "B/L Number", value: "120326YOKDKK23592" },
      { key: "Invoice Number", value: "A03680" },
      { key: "Invoice Issue Date", value: "2026-03-02" },
      { key: "Invoice Value", value: "24,322.00 USD" },
      { key: "Incoterms", value: "CIF" },
      { key: "Payment Method", value: "KC" },
      { key: "Payment Term", value: "T/T" },
      { key: "Gross Weight", value: "4,713 KGM" },
      { key: "Cargo Arrival Date", value: "2026-03-23" },
      { key: "Exchange Rate", value: "26,137" },
      { key: "Transport Means", value: "ADDISON 050S" },
      { key: "Loading Location", value: "YOKOHAMA - KANAGAWA" },
      { key: "Unloading Location", value: "CANG SP ITC" },
      { key: "Taxable Value Total", value: "635,704,114 VND" },
      { key: "VAT Amount Total", value: "50,856,329 VND" },
    ],
    customsItems: [
      { hsCode: "21039029", description: "VEGETABLE POWDER P007 (Bột gia vị hỗn hợp)", qty: "4,000", uom: "KGM", unitPrice: "5.25", invoiceValue: "21,000.00", taxableValueVnd: "548,877,000", importTaxPct: "0", importTaxVnd: "0", vatPct: "8", vatVnd: "43,910,160" },
      { hsCode: "21039029", description: "MEAT SEASONING A6391 (Bột gia vị thịt)", qty: "20", uom: "KGM", unitPrice: "8.60", invoiceValue: "172.00", taxableValueVnd: "4,495,564", importTaxPct: "0", importTaxVnd: "0", vatPct: "8", vatVnd: "359,645" },
      { hsCode: "21039029", description: "SOY SAUCE POWDER A6016 (Bột gia vị hỗn hợp)", qty: "500", uom: "KGM", unitPrice: "6.30", invoiceValue: "3,150.00", taxableValueVnd: "82,331,550", importTaxPct: "0", importTaxVnd: "0", vatPct: "8", vatVnd: "6,586,524" },
    ],
    pdfMap: {
      "Invoice": "/pdfs/Invoice_Nikken.pdf",
      "Bill of Lading": "/pdfs/Bill_of_Lading_Nikken.pdf",
      "Customs Declaration": "/pdfs/Customs_Declaration_Nikken.pdf",
    },
    stageDocs: {
      "Stage 1": [
        { label: "Purchase Order", docNo: "26010550" },
        { label: "Purchase Order", docNo: "26010785" },
        { label: "Purchase Order", docNo: "26020191" },
        { label: "Bill of Lading", docNo: "YOKDKK23592" },
      ],
      "Stage 2": [
        { label: "Purchase Order", docNo: "26010550" },
        { label: "Purchase Order", docNo: "26010785" },
        { label: "Purchase Order", docNo: "26020191" },
        { label: "Bill of Lading", docNo: "YOKDKK23592" },
        { label: "Customs Declaration", docNo: "108114267810" },
      ],
      "Stage 3": [
        { label: "Purchase Order", docNo: "26010550" },
        { label: "Purchase Order", docNo: "26010785" },
        { label: "Purchase Order", docNo: "26020191" },
        { label: "Bill of Lading", docNo: "YOKDKK23592" },
        { label: "Customs Declaration", docNo: "108114267810" },
        { label: "Goods Receipt", docNo: "—" },
      ],
    },
    stageBanners: {
      "Stage 1": [
        { text: "Matching Stage 1 completed — Invoice ↔ PO ↔ BL reconciled. 100% matched.", tone: "success" },
        { text: "Tran Van Lai confirmed at 08:56 on 05-Feb-2026", tone: "success" },
      ],
      "Stage 2": [
        { text: "Matching Stage 2 completed — Customs Declaration added. All header + item lines matched.", tone: "success" },
      ],
      "Stage 3": [],
    },
    stageComplete: { "Stage 1": true, "Stage 2": true, "Stage 3": false },
    headerMatchRows: [
      ["Vendor", "Nikken Foods", "Nikken Foods", "—", "Nikken Foods", "Nikken Foods", "—"],
      ["Buyer / Consignee", "Asia Chemical", "Asia Chemical", "—", "Asia Chemical", "Asia Chemical", "—"],
      ["PO Number", "26010550, 26010785, 26020191", "26010550, 26010785, 26020191", "—", "—", "—", "—"],
      ["Contract Number", "Không áp dụng", "Không áp dụng", "Không áp dụng", "—", "—", "—"],
      ["Currency", "USD", "USD", "—", "—", "USD", "—"],
      ["Incoterm", "CIF Ho Chi Minh", "CIF Ho Chi Minh", "—", "—", "CIF", "—"],
      ["Payment Term", "TT 60D BL", "TT 60D BL", "—", "—", "—", "—"],
      ["Bank", "Mizuho Hamamatsu", "Mizuho Hamamatsu", "—", "—", "—", "—"],
      ["Shipment / Vessel", "ADDISON 050S", "—", "—", "ADDISON 050S", "ADDISON 050S", "—"],
      ["Container", "1 x 20' Dry", "—", "—", "1 x 20' Dry", "—", "—"],
      ["Invoice Amount", "24,322.00 USD", "24,322.00 USD", "—", "—", "24,322.00 USD", "—"],
    ],
    itemMatchLines: [
      {
        id: 1, itemCode: "VGP-P007", productName: "VEGETABLE POWDER P007", uom: "KG", qty: "4,000", unitPrice: "5.2500", lineAmount: "21,000.00",
        matchedDocs: {
          "Stage 1": [
            { label: "Purchase Order", docNo: "26010550", qty: "4,000", unitPrice: "5.2500", lineAmount: "21,000.00" },
            { label: "Bill of Lading", docNo: "YOKDKK23592", qty: "4,000", unitPrice: "5.2500", lineAmount: "21,000.00" },
          ],
          "Stage 2": [
            { label: "Purchase Order", docNo: "26010550", qty: "4,000", unitPrice: "5.2500", lineAmount: "21,000.00" },
            { label: "Bill of Lading", docNo: "YOKDKK23592", qty: "4,000", unitPrice: "5.2500", lineAmount: "21,000.00" },
            { label: "Customs Declaration", docNo: "108114267810", qty: "4,000", unitPrice: "5.25", lineAmount: "21,000.00" },
          ],
          "Stage 3": [],
        },
      },
      {
        id: 2, itemCode: "SSP-A6016", productName: "SOY SAUCE POWDER A6016", uom: "KG", qty: "500", unitPrice: "6.3000", lineAmount: "3,150.00",
        matchedDocs: {
          "Stage 1": [
            { label: "Purchase Order", docNo: "26010785", qty: "500", unitPrice: "6.3000", lineAmount: "3,150.00" },
            { label: "Bill of Lading", docNo: "YOKDKK23592", qty: "500", unitPrice: "6.3000", lineAmount: "3,150.00" },
          ],
          "Stage 2": [
            { label: "Purchase Order", docNo: "26010785", qty: "500", unitPrice: "6.3000", lineAmount: "3,150.00" },
            { label: "Bill of Lading", docNo: "YOKDKK23592", qty: "500", unitPrice: "6.3000", lineAmount: "3,150.00" },
            { label: "Customs Declaration", docNo: "108114267810", qty: "500", unitPrice: "6.30", lineAmount: "3,150.00" },
          ],
          "Stage 3": [],
        },
      },
      {
        id: 3, itemCode: "MST-A6391", productName: "MEAT SEASONING A6391", uom: "KG", qty: "20", unitPrice: "8.6000", lineAmount: "172.00",
        matchedDocs: {
          "Stage 1": [
            { label: "Purchase Order", docNo: "26020191", qty: "20", unitPrice: "8.6000", lineAmount: "172.00" },
            { label: "Bill of Lading", docNo: "YOKDKK23592", qty: "20", unitPrice: "8.6000", lineAmount: "172.00" },
          ],
          "Stage 2": [
            { label: "Purchase Order", docNo: "26020191", qty: "20", unitPrice: "8.6000", lineAmount: "172.00" },
            { label: "Bill of Lading", docNo: "YOKDKK23592", qty: "20", unitPrice: "8.6000", lineAmount: "172.00" },
            { label: "Customs Declaration", docNo: "108114267810", qty: "20", unitPrice: "8.60", lineAmount: "172.00" },
          ],
          "Stage 3": [],
        },
      },
    ],
    activityEvents: [
      { date: "20-Jan", t: "09:00", icon: FileDown, title: "Purchase Order synchronized", who: "System · Vendor Portal", desc: "PO 26010550 (Vegetable Powder P007) received from vendor portal." },
      { date: "26-Jan", t: "09:00", icon: FileDown, title: "Purchase Order synchronized", who: "System · Vendor Portal", desc: "PO 26010785 (Soy Sauce Powder A6016) received from vendor portal." },
      { date: "09-Feb", t: "09:00", icon: FileDown, title: "Purchase Order synchronized", who: "System · Vendor Portal", desc: "PO 26020191 (Meat Seasoning A6391) received from vendor portal." },
      { date: "02-Mar", t: "10:00", icon: FileDown, title: "Commercial Invoice synchronized", who: "System", desc: "Invoice A03680 downloaded from vendor portal." },
      { date: "12-Mar", t: "14:00", icon: FileDown, title: "Bill of Lading synchronized", who: "System · Freight Forwarder", desc: "BL YOKDKK23592 received." },
      { date: "13-Mar", t: "08:15", icon: ScanText, title: "OCR completed", who: "System · OCR Engine v3.1", desc: "Structured extraction on 5 documents · fields captured." },
      { date: "18-Mar", t: "09:05", icon: GitCompareArrows, title: "Matching Stage 1 completed", who: "System", desc: "Invoice ↔ PO ↔ BL reconciled. 100% matched." },
      { date: "02-Apr", t: "20:22", icon: Landmark, title: "Customs Declaration synchronized", who: "System · VNACCS", desc: "Customs declaration 108114267810 linked." },
      { date: "03-Apr", t: "09:10", icon: Clock, title: "Matching Stage 2 in progress", who: "System", desc: "Customs Declaration added, pending Finance approval." },
    ],
    activityHeaderLabel: "{n} events",
    approverName: "Tran Van Lai",
    approverTime: "08:56",
  },
};

function InvoiceDetailPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const profile = INVOICE_PROFILES[id] ?? INVOICE_PROFILES.LH261730;
  const [mainTab, setMainTab] = useState<MainTab>("Matching");
  const [infoTab, setInfoTab] = useState<InfoTab>("Invoice");
  const [stage, setStage] = useState<StageTab>(profile.stage);
  const [pdfCollapsed, setPdfCollapsed] = useState(false);
  const [declarationVariant, setDeclarationVariant] = useState<DeclarationVariant>("Original");
  const [selectedPoId, setSelectedPoId] = useState(profile.purchaseOrders[0]?.id ?? "");
  const [selectedContractId, setSelectedContractId] = useState(profile.salesContracts[0]?.id ?? "");

  useEffect(() => {
    if (infoTab !== "Customs Declaration") setDeclarationVariant("Original");
  }, [infoTab]);

  const [phaseStatus, setPhaseStatus] = useState<Record<StageTab, PhaseState>>({
    "Stage 1": { status: "Pending" },
    "Stage 2": { status: "Pending" },
    "Stage 3": { status: "Pending" },
  });
  const [rejectStep, setRejectStep] = useState<0 | 1 | 2>(0);
  const [rejectReason, setRejectReason] = useState("");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    setMainTab("Matching");
    setInfoTab("Invoice");
    setStage(profile.stage);
    setDeclarationVariant("Original");
    setSelectedPoId(profile.purchaseOrders[0]?.id ?? "");
    setSelectedContractId(profile.salesContracts[0]?.id ?? "");
    setPhaseStatus({
      "Stage 1": { status: "Pending" },
      "Stage 2": { status: "Pending" },
      "Stage 3": { status: "Pending" },
    });
    setRejectStep(0);
    setRejectReason("");
    setResetConfirmOpen(false);
    setActivityLog([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const nowTime = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const today = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).replace(" ", "-");

  const openReject = () => { setRejectReason(""); setRejectStep(1); };
  const closeReasonModal = () => { setRejectStep(0); setRejectReason(""); };
  const confirmReason = () => { if (!rejectReason.trim()) return; setRejectStep(2); };
  const cancelWarning = () => { setRejectStep(0); setRejectReason(""); };
  const confirmReject = () => {
    setPhaseStatus((prev) => ({ ...prev, [stage]: { status: "Rejected", reason: rejectReason } }));
    setActivityLog((prev) => [
      ...prev,
      { date: today(), t: nowTime(), icon: XCircle, title: "Invoice rejected", who: CURRENT_USER, desc: `${t(stage)} · ${t("Reason")}: ${rejectReason}` },
    ]);
    setRejectStep(0);
    setRejectReason("");
  };
  const openResetConfirm = () => setResetConfirmOpen(true);
  const cancelResetConfirm = () => setResetConfirmOpen(false);
  const confirmReset = () => {
    setPhaseStatus((prev) => ({ ...prev, [stage]: { status: "Pending" } }));
    setActivityLog((prev) => [
      ...prev,
      { date: today(), t: nowTime(), icon: RotateCcw, title: "Invoice returned to pending", who: CURRENT_USER, desc: `${t(stage)}` },
    ]);
    setResetConfirmOpen(false);
  };

  return (
    <>
    <AppShell
      breadcrumb={
        <div className="flex items-center gap-1.5">
          <span>{t("Import Operations")}</span>
          <ChevronRight className="h-3 w-3" />
          <Link to="/" className="hover:text-primary">{t("Invoice List")}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-text-primary font-medium">{id}</span>
        </div>
      }
    >
      <div className="p-4 h-full flex flex-col">
        {/* Split view */}
        <div
          className={`relative grid flex-1 min-h-0 transition-[grid-template-columns] duration-200 ${
            pdfCollapsed ? "grid-cols-[0px_1fr] gap-0" : "grid-cols-[35%_1fr] gap-3"
          }`}
        >
          {/* Collapse/expand toggle — sits on the border between the two panels */}
          <button
            onClick={() => setPdfCollapsed((v) => !v)}
            title={pdfCollapsed ? t("Show original document") : t("Hide original document")}
            className={`absolute top-14 z-10 h-9 w-4 inline-flex items-center justify-center rounded-r-md border border-l-0 border-border bg-white shadow-sm text-text-secondary hover:bg-muted hover:text-primary transition-[left] duration-200 ${
              pdfCollapsed ? "left-0" : "left-[35%]"
            }`}
          >
            {pdfCollapsed ? <ChevronsRight className="h-3 w-3" /> : <ChevronsLeft className="h-3 w-3" />}
          </button>

          {/* LEFT — PDF viewer */}
          <div className={`h-full min-w-0 min-h-0 grid ${pdfCollapsed ? "overflow-hidden pointer-events-none" : ""}`}>
            <PdfViewer profile={profile} active={infoTab} declarationVariant={declarationVariant} selectedPoId={selectedPoId} selectedContractId={selectedContractId} />
          </div>

          {/* RIGHT */}
          <div className="bg-white border border-border rounded-md flex flex-col min-w-0 min-h-0">
            {/* Main tabs */}
            <div className="border-b border-border flex items-center px-2">
              {(["Information", "Matching", "Activity"] as MainTab[]).map((mt, i) => (
                <Fragment key={mt}>
                  {i > 0 && <div className="h-4 w-px bg-border" />}
                  <button
                    onClick={() => setMainTab(mt)}
                    className="h-12 px-4 inline-flex flex-col items-center justify-center gap-1.5"
                  >
                    <span className={`text-[12.5px] font-medium uppercase tracking-wide ${
                      mainTab === mt ? "text-primary" : "text-text-secondary hover:text-text-primary"
                    }`}>
                      {t(mt)}
                    </span>
                    <span className={`h-[1.5px] w-full rounded-full ${mainTab === mt ? "bg-primary" : "bg-transparent"}`} />
                  </button>
                </Fragment>
              ))}
            </div>

            <div className="flex-1 overflow-auto">
              {mainTab === "Information" && (
                <InformationTab
                  key={id}
                  profile={profile}
                  infoTab={infoTab}
                  setInfoTab={setInfoTab}
                  stage={stage}
                  docStatus={phaseStatus[stage]}
                  declarationVariant={declarationVariant}
                  setDeclarationVariant={setDeclarationVariant}
                  selectedPoId={selectedPoId}
                  setSelectedPoId={setSelectedPoId}
                  selectedContractId={selectedContractId}
                  setSelectedContractId={setSelectedContractId}
                />
              )}
              {mainTab === "Matching" && (
                <MatchingTab key={id} profile={profile} stage={stage} setStage={setStage} phaseStatus={phaseStatus} />
              )}
              {mainTab === "Activity" && <ActivityTab profile={profile} extraEvents={activityLog} />}
            </div>

            {mainTab === "Matching" && (
              <BottomActionBar
                phaseState={phaseStatus[stage]}
                stageComplete={profile.stageComplete[stage]}
                approverName={profile.approverName}
                approverTime={profile.approverTime}
                onReject={openReject}
                onOpenResetConfirm={openResetConfirm}
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>

    {rejectStep === 1 && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md shadow-lg w-full max-w-md">
          <div className="px-5 pt-5 pb-3 border-b border-border">
            <div className="text-[14px] font-semibold text-text-primary">{t("Reason for rejecting invoice")}</div>
          </div>
          <div className="px-5 py-4">
            <textarea
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t("Add rejection reason...")}
              rows={4}
              className="w-full border border-border rounded-md px-3 py-2 text-[12.5px] focus:outline-none focus:border-primary resize-none"
            />
            {!rejectReason.trim() && (
              <div className="text-[11px] text-error mt-1.5">{t("Reason is required")}</div>
            )}
          </div>
          <div className="px-5 pb-5 flex items-center justify-end gap-2">
            <button
              onClick={closeReasonModal}
              className="h-8 px-4 border border-border text-text-primary bg-white rounded-full text-[12px] font-medium hover:bg-muted"
            >
              {t("Close")}
            </button>
            <button
              onClick={confirmReason}
              disabled={!rejectReason.trim()}
              className="h-8 px-4 bg-primary text-white rounded-full text-[12px] font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
            >
              {t("Confirm")}
            </button>
          </div>
        </div>
      </div>
    )}

    {rejectStep === 2 && (
      <ConfirmModal
        icon={<AlertTriangle className="h-6 w-6 text-warning" />}
        message={
          <>
            {t("Are you sure you want to")}{" "}
            <span className="text-error font-semibold">{t("not approve")}</span>{" "}
            {t("this invoice?")}
          </>
        }
        cancelLabel={t("No, skip")}
        confirmLabel={t("Confirm")}
        onCancel={cancelWarning}
        onConfirm={confirmReject}
      />
    )}

    {resetConfirmOpen && (
      <ConfirmModal
        icon={<AlertTriangle className="h-6 w-6 text-warning" />}
        message={t("Confirm return to pending?")}
        cancelLabel={t("Cancel")}
        confirmLabel={t("Confirm")}
        onCancel={cancelResetConfirm}
        onConfirm={confirmReset}
      />
    )}
    </>
  );
}

function ConfirmModal({
  icon, message, cancelLabel, confirmLabel, onCancel, onConfirm,
}: {
  icon: React.ReactNode; message: React.ReactNode; cancelLabel: string; confirmLabel: string;
  onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-md shadow-lg w-full max-w-md p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0">{icon}</div>
          <div className="text-[13px] text-text-primary leading-relaxed pt-0.5">{message}</div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-8 px-4 border border-border text-text-primary bg-white rounded-full text-[12px] font-medium hover:bg-muted"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="h-8 px-4 bg-primary text-white rounded-full text-[12px] font-medium hover:brightness-110"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PdfViewer({ profile, active, declarationVariant, selectedPoId, selectedContractId }: { profile: InvoiceProfile; active: InfoTab; declarationVariant: DeclarationVariant; selectedPoId: string; selectedContractId: string }) {
  const { t } = useI18n();
  const pdfMap = profile.pdfMap;
  const originalDeclarationFileUrl = pdfMap["Customs Declaration"];
  const adjustedDeclarationFileUrl: string | null = null;

  const currentPo = profile.purchaseOrders.find((p) => p.id === selectedPoId) ?? null;
  const currentContract = profile.salesContracts.find((c) => c.id === selectedContractId) ?? null;

  const isCustomsDeclaration = active === "Customs Declaration";
  const pdfUrl = isCustomsDeclaration
    ? (declarationVariant === "Original" ? originalDeclarationFileUrl : adjustedDeclarationFileUrl)
    : active === "Purchase Order" ? (currentPo?.fileUrl ?? null)
    : active === "Sales Contract" ? (currentContract?.fileUrl ?? null)
    : pdfMap[active];
  const isEmptyAdjusted = isCustomsDeclaration && declarationVariant === "Adjusted" && !pdfUrl;

  return (
    <div className="bg-white border border-border rounded-md flex flex-col overflow-hidden">
      <div className="h-10 border-b border-border flex items-center justify-between px-3 text-[12px] shrink-0">
        <div className="inline-flex items-center gap-2 text-text-primary font-medium">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span>
            {t(active)}
            {isCustomsDeclaration ? ` — ${t(declarationVariant === "Original" ? "Original Declaration" : "Adjusted Declaration")}` : ""}
            {active === "Purchase Order" && currentPo ? ` — ${currentPo.label}` : ""}
            .pdf
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-[#e9ecef] flex">
        {pdfUrl ? (
          <iframe src={pdfUrl + "#view=FitH"} className="w-full h-full border-none" title={`${active} PDF`} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <FileText className="h-10 w-10 text-text-secondary mx-auto mb-2 opacity-50" />
              {isEmptyAdjusted ? (
                <div className="text-[13px] font-medium text-text-primary">{t("No adjusted declaration yet")}</div>
              ) : (
                <>
                  <div className="text-[13px] font-medium text-text-primary">{t("Original document not available")}</div>
                  <div className="text-[11.5px] text-text-secondary mt-1">{t("Original document file not found for {active}.", { active: t(active) })}</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SegmentedSelector({ options, activeId, onSelect }: {
  options: { id: string; label: string }[]; activeId: string; onSelect: (id: string) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-border overflow-hidden">
      {options.map((opt, i) => (
        <Fragment key={opt.id}>
          {i > 0 && <div className="w-px h-full bg-border" />}
          <button
            onClick={() => onSelect(opt.id)}
            className={`px-3 h-7 text-[11.5px] font-medium ${
              activeId === opt.id ? "bg-primary-light text-primary" : "bg-white text-text-secondary hover:bg-muted hover:text-text-primary"
            }`}
          >
            {opt.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

function DocumentPreview({ kind }: { kind: InfoTab }) {
  if (kind === "Invoice") {
    return (
      <div className="space-y-2 leading-tight">
        <div className="text-center border-b border-border pb-2">
          <div className="font-semibold text-[12px]">QINHUANGDAO LIHUA STARCH CO., LTD.</div>
          <div className="text-[9px] text-text-secondary">No.89 Lihua Street, Funing District, Qinhuangdao, Hebei, China</div>
          <div className="mt-2 font-semibold tracking-widest text-[11px]">COMMERCIAL INVOICE</div>
        </div>
        <PreviewRow k="Invoice No" v={SHIPMENT.invoiceNo} />
        <PreviewRow k="Invoice Date" v={SHIPMENT.invoiceDate} />
        <PreviewRow k="Contract No" v={SHIPMENT.contractNo} />
        <PreviewRow k="Consignee" v="ASIA CHEMICAL CORPORATION" />
        <PreviewRow k="Incoterm" v={SHIPMENT.incoterm} />
        <PreviewRow k="Payment" v={SHIPMENT.paymentTerm} />
        <div className="border-t border-border mt-2 pt-2">
          <div className="grid grid-cols-[1fr_50px_60px_60px] gap-1 font-semibold border-b border-border pb-1">
            <span>Description</span><span className="text-right">Qty</span><span className="text-right">Unit</span><span className="text-right">Amount</span>
          </div>
          <div className="grid grid-cols-[1fr_50px_60px_60px] gap-1 py-1">
            <span>{SHIPMENT.product}</span>
            <span className="text-right">55,000</span>
            <span className="text-right">465.00</span>
            <span className="text-right">25,575.00</span>
          </div>
          <div className="grid grid-cols-[1fr_60px] gap-1 border-t border-border pt-1 font-semibold">
            <span className="text-right">TOTAL USD</span>
            <span className="text-right">25,575.00</span>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "Bill of Lading") {
    return (
      <div className="space-y-1.5 leading-tight">
        <div className="text-center font-semibold text-[11px] border-b border-border pb-1.5">BILL OF LADING</div>
        <PreviewRow k="B/L No" v={SHIPMENT.blNo} />
        <PreviewRow k="Vessel" v={SHIPMENT.vessel} />
        <PreviewRow k="Port of Loading" v={SHIPMENT.pol} />
        <PreviewRow k="Port of Discharge" v={SHIPMENT.pod} />
        <PreviewRow k="Container" v={SHIPMENT.container} />
        <PreviewRow k="Gross Weight" v={SHIPMENT.grossWeight} />
        <PreviewRow k="Measurement" v={SHIPMENT.measurement} />
        <PreviewRow k="Freight" v={SHIPMENT.freight} />
        <PreviewRow k="Laden On Board" v={SHIPMENT.blDate} />
      </div>
    );
  }
  if (kind === "Customs Declaration") {
    return (
      <div className="space-y-1.5 leading-tight">
        <div className="text-center font-semibold text-[11px] border-b border-border pb-1.5">TỜ KHAI HẢI QUAN NHẬP KHẨU</div>
        <PreviewRow k="Declaration No" v="105678923420" />
        <PreviewRow k="Date" v={SHIPMENT.customsDate} />
        <PreviewRow k="Importer" v="Asia Chemical Corporation" />
        <PreviewRow k="Exporter" v="Qinhuangdao Lihua Starch" />
        <PreviewRow k="Invoice" v={SHIPMENT.invoiceNo} />
        <PreviewRow k="Invoice Value" v={`${SHIPMENT.amount} USD`} />
        <PreviewRow k="Customs Value" v={`${SHIPMENT.customsValueVnd} VND`} />
        <PreviewRow k="VAT" v={`${SHIPMENT.vatVnd} VND`} />
        <PreviewRow k="FX Rate" v={SHIPMENT.exchangeRate} />
      </div>
    );
  }
  if (kind === "Sales Contract") {
    return (
      <div className="space-y-1.5 leading-tight">
        <div className="text-center font-semibold text-[11px] border-b border-border pb-1.5">SALES CONTRACT</div>
        <PreviewRow k="Contract No" v={SHIPMENT.contractNo} />
        <PreviewRow k="Seller" v="Qinhuangdao Lihua Starch Co., Ltd." />
        <PreviewRow k="Buyer" v="Asia Chemical Corporation" />
        <PreviewRow k="Product" v={SHIPMENT.product} />
        <PreviewRow k="Quantity" v={`${SHIPMENT.qty} KG`} />
        <PreviewRow k="Unit Price" v={`${SHIPMENT.unitPrice} USD / MT`} />
        <PreviewRow k="Total" v={`${SHIPMENT.amount} USD`} />
        <PreviewRow k="Incoterm" v={SHIPMENT.incoterm} />
        <PreviewRow k="Payment" v={SHIPMENT.paymentTerm} />
      </div>
    );
  }
  return (
    <div className="space-y-1.5 leading-tight">
      <div className="text-center font-semibold text-[11px] border-b border-border pb-1.5">PURCHASE ORDER</div>
      <PreviewRow k="PO Number" v={SHIPMENT.poNo} />
      <PreviewRow k="Status" v="Approved" />
      <PreviewRow k="Vendor" v="Qinhuangdao Lihua Starch Co., Ltd." />
      <PreviewRow k="Currency" v="USD" />
      <PreviewRow k="Material" v={SHIPMENT.product} />
      <PreviewRow k="Qty" v={`${SHIPMENT.qty} KG`} />
      <PreviewRow k="Unit Price" v={`${SHIPMENT.unitPrice} USD / MT`} />
      <PreviewRow k="Total" v={`${SHIPMENT.amount} USD`} />
    </div>
  );
}

function PreviewRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 text-[9.5px]">
      <span className="text-text-secondary">{k}</span>
      <span className="font-medium break-all">{v}</span>
    </div>
  );
}

/* ============== Information Tab ============== */
function InformationTab({
  profile, infoTab, setInfoTab, stage, docStatus, declarationVariant, setDeclarationVariant,
  selectedPoId, setSelectedPoId, selectedContractId, setSelectedContractId,
}: {
  profile: InvoiceProfile;
  infoTab: InfoTab; setInfoTab: (t: InfoTab) => void; stage: StageTab; docStatus: PhaseState;
  declarationVariant: DeclarationVariant; setDeclarationVariant: (v: DeclarationVariant) => void;
  selectedPoId: string; setSelectedPoId: (id: string) => void;
  selectedContractId: string; setSelectedContractId: (id: string) => void;
}) {
  const { t } = useI18n();
  const infoTabs: InfoTab[] = ["Invoice", "Purchase Order", "Sales Contract", "Bill of Lading", "Customs Declaration"];

  const currentPo = profile.purchaseOrders.find((p) => p.id === selectedPoId) ?? null;
  const currentContract = profile.salesContracts.find((c) => c.id === selectedContractId) ?? null;

  const [savedData, setSavedData] = useState<Record<SingularInfoTab, DocData>>(profile.infoData);
  const [poSavedData, setPoSavedData] = useState<Record<string, DocData>>(() =>
    Object.fromEntries(profile.purchaseOrders.map((po) => [po.id, po.data]))
  );
  const [contractSavedData, setContractSavedData] = useState<Record<string, DocData>>(() =>
    Object.fromEntries(profile.salesContracts.map((c) => [c.id, c.data]))
  );
  const [editingTab, setEditingTab] = useState<EditableInfoTab | null>(null);
  const [draft, setDraft] = useState<DocData | null>(null);

  useEffect(() => {
    setEditingTab(null);
    setDraft(null);
  }, [infoTab]);

  useEffect(() => {
    setEditingTab(null);
    setDraft(null);
  }, [selectedPoId, selectedContractId]);

  const isEditable = infoTab !== "Customs Declaration";
  const isEditing = isEditable && editingTab === infoTab;
  const savedDocData =
    infoTab === "Purchase Order" ? (currentPo ? poSavedData[currentPo.id] : undefined)
    : infoTab === "Sales Contract" ? (currentContract ? contractSavedData[currentContract.id] : undefined)
    : isEditable ? savedData[infoTab as SingularInfoTab]
    : undefined;
  const docData = isEditable ? (isEditing ? draft : (savedDocData ?? null)) : null;

  const handleEdit = () => {
    if (!isEditable || !savedDocData) return;
    setDraft(structuredClone(savedDocData));
    setEditingTab(infoTab as EditableInfoTab);
  };

  const handleSave = () => {
    if (!editingTab || !draft) return;
    if (editingTab === "Purchase Order" && currentPo) {
      setPoSavedData((prev) => ({ ...prev, [currentPo.id]: draft }));
    } else if (editingTab === "Sales Contract" && currentContract) {
      setContractSavedData((prev) => ({ ...prev, [currentContract.id]: draft }));
    } else if (editingTab === "Invoice" || editingTab === "Bill of Lading") {
      setSavedData((prev) => ({ ...prev, [editingTab]: draft }));
    }
    setEditingTab(null);
    setDraft(null);
  };

  const handleCancel = () => {
    setEditingTab(null);
    setDraft(null);
  };

  const updateHeaderField = (index: number, value: string) => {
    setDraft((prev) => (prev ? { ...prev, header: prev.header.map((f, i) => (i === index ? { ...f, value } : f)) } : prev));
  };

  const updateBankField = (index: number, value: string) => {
    setDraft((prev) => (prev?.bank ? { ...prev, bank: prev.bank.map((f, i) => (i === index ? { ...f, value } : f)) } : prev));
  };

  const updateItemField = (id: number, field: keyof ItemRow, value: string) => {
    setDraft((prev) => (prev?.items ? { ...prev, items: prev.items.map((row) => (row.id === id ? { ...row, [field]: value } : row)) } : prev));
  };

  const addItemRow = () => {
    setDraft((prev) => {
      if (!prev?.items) return prev;
      const nextId = Math.max(0, ...prev.items.map((r) => r.id)) + 1;
      const hasCurrency = prev.items.some((r) => r.currency !== undefined);
      const newRow: ItemRow = { id: nextId, productName: "", qty: "", uom: "", unitPrice: "", lineAmount: "", ...(hasCurrency ? { currency: "" } : {}) };
      return { ...prev, items: [...prev.items, newRow] };
    });
  };

  const removeItemRow = (id: number) => {
    setDraft((prev) => (prev?.items ? { ...prev, items: prev.items.filter((r) => r.id !== id) } : prev));
  };

  const updateGoodsField = (id: number, field: keyof GoodsRow, value: string) => {
    setDraft((prev) => (prev?.goods ? { ...prev, goods: prev.goods.map((row) => (row.id === id ? { ...row, [field]: value } : row)) } : prev));
  };

  const addGoodsRow = () => {
    setDraft((prev) => {
      if (!prev?.goods) return prev;
      const nextId = Math.max(0, ...prev.goods.map((r) => r.id)) + 1;
      return { ...prev, goods: [...prev.goods, { id: nextId, description: "", netWeight: "", grossWeight: "" }] };
    });
  };

  const removeGoodsRow = (id: number) => {
    setDraft((prev) => (prev?.goods ? { ...prev, goods: prev.goods.filter((r) => r.id !== id) } : prev));
  };

  const renderHeaderInformation = () => {
    if (infoTab === "Customs Declaration") {
      return <FieldGrid fields={profile.customsHeaderFields} />;
    }

    if (!docData) return null;
    const bankEditable = isEditing && infoTab === "Invoice";
    return (
      <>
        <FieldGrid fields={docData.header} editing={isEditing} onChange={updateHeaderField} />
        {docData.bank && (
          <div className="mt-4">
            <div className="text-[11.5px] font-semibold text-text-primary mb-1.5">{t("Bank Information")}</div>
            <FieldGrid fields={docData.bank} editing={bankEditable} onChange={updateBankField} />
          </div>
        )}
      </>
    );
  };

  const renderItemTable = (data: DocData, hasCurrency: boolean) => {
    if (!data.items) return null;
    const colSpan = hasCurrency ? 6 : 5;
    if (data.items.length === 0 && !isEditing) {
      return (
        <div>
          <div className="text-[12px] font-semibold text-text-primary mb-2">{t("Item Table")}</div>
          <div className="border border-border rounded-md py-4 text-center text-[12px] text-text-secondary">{t("No data available")}</div>
        </div>
      );
    }
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12px] font-semibold text-text-primary">{t("Item Table")}</div>
          {isEditing && (
            <button onClick={addItemRow} className="h-6 px-2 inline-flex items-center gap-1 text-[11px] text-primary border border-primary/30 rounded hover:bg-primary-light">
              <Plus className="h-3 w-3" /> {t("Add Row")}
            </button>
          )}
        </div>
        <div className="border border-border rounded-md overflow-x-auto">
          <table className="ent-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th>{t("Product Name")}</th>
                <th className="text-right">{t("Qty")}</th>
                <th>{t("UoM")}</th>
                <th className="text-right">{t("Unit Price")}</th>
                {hasCurrency && <th>{t("Currency")}</th>}
                <th className="text-right">{t("Line Amount")}</th>
                {isEditing && <th className="w-8" />}
              </tr>
            </thead>
            <tbody>
              {data.items.map((row, idx) => (
                <tr key={row.id}>
                  <td>{idx + 1}</td>
                  <td>{isEditing ? <CellInput value={row.productName} onChange={(v) => updateItemField(row.id, "productName", v)} /> : row.productName}</td>
                  <td className="text-right tabular-nums">{isEditing ? <CellInput value={row.qty} onChange={(v) => updateItemField(row.id, "qty", v)} align="right" /> : row.qty}</td>
                  <td>{isEditing ? <CellInput value={row.uom} onChange={(v) => updateItemField(row.id, "uom", v)} /> : row.uom}</td>
                  <td className="text-right tabular-nums">{isEditing ? <CellInput value={row.unitPrice} onChange={(v) => updateItemField(row.id, "unitPrice", v)} align="right" /> : row.unitPrice}</td>
                  {hasCurrency && <td>{isEditing ? <CellInput value={row.currency ?? ""} onChange={(v) => updateItemField(row.id, "currency", v)} /> : row.currency}</td>}
                  <td className="text-right tabular-nums font-medium">{isEditing ? <CellInput value={row.lineAmount} onChange={(v) => updateItemField(row.id, "lineAmount", v)} align="right" /> : row.lineAmount}</td>
                  {isEditing && (
                    <td>
                      <button onClick={() => removeItemRow(row.id)} className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-error-bg text-text-secondary hover:text-error">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {data.items.length > 0 && (
                <tr className="bg-[#fbfcfd]">
                  <td colSpan={colSpan} className="text-right font-semibold">{t("Total")}</td>
                  <td className="text-right font-semibold tabular-nums">{sumItemAmounts(data.items)} USD</td>
                  {isEditing && <td />}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderGoodsTable = (data: DocData) => {
    if (!data.goods) return null;
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12px] font-semibold text-text-primary">{t("Goods Description")}</div>
          {isEditing && (
            <button onClick={addGoodsRow} className="h-6 px-2 inline-flex items-center gap-1 text-[11px] text-primary border border-primary/30 rounded hover:bg-primary-light">
              <Plus className="h-3 w-3" /> {t("Add Row")}
            </button>
          )}
        </div>
        <div className="border border-border rounded-md overflow-x-auto">
          <table className="ent-table whitespace-nowrap min-w-max">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th>{t("Description")}</th>
                <th className="text-right">{t("Net Weight")}</th>
                <th className="text-right">{t("Gross Weight")}</th>
                {isEditing && <th className="w-8" />}
              </tr>
            </thead>
            <tbody>
              {data.goods.map((row, idx) => (
                <tr key={row.id}>
                  <td>{idx + 1}</td>
                  <td>{isEditing ? <CellInput value={row.description} onChange={(v) => updateGoodsField(row.id, "description", v)} /> : row.description}</td>
                  <td className="text-right tabular-nums">{isEditing ? <CellInput value={row.netWeight} onChange={(v) => updateGoodsField(row.id, "netWeight", v)} align="right" /> : row.netWeight}</td>
                  <td className="text-right tabular-nums">{isEditing ? <CellInput value={row.grossWeight} onChange={(v) => updateGoodsField(row.id, "grossWeight", v)} align="right" /> : row.grossWeight}</td>
                  {isEditing && (
                    <td>
                      <button onClick={() => removeGoodsRow(row.id)} className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-error-bg text-text-secondary hover:text-error">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="border-b border-border flex items-center px-2 bg-[#fbfcfd]">
        {infoTabs.map((it, i) => (
          <Fragment key={it}>
            {i > 0 && <div className="h-4 w-px bg-border" />}
            <button
              onClick={() => setInfoTab(it)}
              className={`px-3.5 py-2 my-1 inline-flex flex-col items-center gap-1 rounded-md ${
                infoTab === it ? "bg-primary-light" : ""
              }`}
            >
              <span className={`text-[11.5px] font-medium uppercase tracking-wide whitespace-nowrap ${
                infoTab === it ? "text-primary" : "text-text-secondary hover:text-text-primary"
              }`}>
                {t(it)}
              </span>
              <span className={`h-[1.5px] w-full rounded-full ${infoTab === it ? "bg-primary" : "bg-transparent"}`} />
            </button>
          </Fragment>
        ))}
      </div>

      <div className="px-4 pt-3 flex items-center gap-4 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-text-secondary">{t("Document Set Status")}:</span>
          <span className={`inline-flex items-center px-2 h-[20px] rounded-full text-[11px] font-medium leading-none ${
            docStatus.status === "Approved" ? "bg-success-bg text-success"
              : docStatus.status === "Pending" ? "bg-primary-light text-primary"
              : "bg-error-bg text-error"
          }`}>
            {docStatus.status === "Approved" ? t("Approved") : docStatus.status === "Pending" ? t("Pending") : t("Not Approved")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-text-secondary">{t("Matching Stage")}:</span>
          <span className="inline-flex items-center px-2 h-[20px] rounded-full text-[11px] font-medium leading-none bg-primary-light text-primary">
            {t(stage)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {infoTab === "Customs Declaration" && (
          <SegmentedSelector
            options={[
              { id: "Original", label: t("Original Declaration") },
              { id: "Adjusted", label: t("Adjusted Declaration") },
            ]}
            activeId={declarationVariant}
            onSelect={(id) => setDeclarationVariant(id as DeclarationVariant)}
          />
        )}

        {infoTab === "Purchase Order" && profile.purchaseOrders.length > 0 && (
          <SegmentedSelector
            options={profile.purchaseOrders.map((po) => ({ id: po.id, label: po.label }))}
            activeId={selectedPoId}
            onSelect={setSelectedPoId}
          />
        )}

        {infoTab === "Sales Contract" && profile.salesContracts.length > 0 && (
          <SegmentedSelector
            options={profile.salesContracts.map((c) => ({ id: c.id, label: c.label }))}
            activeId={selectedContractId}
            onSelect={setSelectedContractId}
          />
        )}

        <Section
          title={t("Header Information")}
          action={
            isEditable ? (
              isEditing ? (
                <div className="flex items-center gap-2">
                  <button onClick={handleCancel} className="h-7 px-3 border border-border bg-white rounded-md text-[12px] hover:bg-muted">
                    {t("Cancel")}
                  </button>
                  <button onClick={handleSave} className="h-7 px-3 bg-primary text-white rounded-md text-[12px] hover:brightness-110">
                    {t("Save")}
                  </button>
                </div>
              ) : (
                <button onClick={handleEdit} className="h-7 px-3 border border-border bg-white rounded-md text-[12px] inline-flex items-center gap-1.5 hover:bg-muted">
                  <Pencil className="h-3.5 w-3.5" /> {t("Edit")}
                </button>
              )
            ) : undefined
          }
        >
          {renderHeaderInformation()}
        </Section>

        {docData && (infoTab === "Invoice" || infoTab === "Purchase Order" || infoTab === "Sales Contract") &&
          renderItemTable(docData, infoTab === "Purchase Order" || infoTab === "Sales Contract")}

        {infoTab === "Customs Declaration" && (
          <div>
            <div className="text-[12px] font-semibold text-text-primary mb-2">{t("Item Table")}</div>
            <div className="border border-border rounded-md overflow-x-auto">
              <table className="ent-table whitespace-nowrap min-w-max">
                <thead>
                  <tr>
                    <th className="w-8">#</th>
                    <th>{t("HS Code")}</th>
                    <th>{t("Description")}</th>
                    <th className="text-right">{t("Qty")}</th>
                    <th>{t("UoM")}</th>
                    <th className="text-right">{t("Unit Price")}</th>
                    <th className="text-right">{t("Invoice Value")}</th>
                    <th className="text-right">{t("Taxable Value (VND)")}</th>
                    <th className="text-right">{t("Import Tax (%)")}</th>
                    <th className="text-right">{t("Import Tax (VND)")}</th>
                    <th className="text-right">{t("VAT (%)")}</th>
                    <th className="text-right">{t("VAT (VND)")}</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.customsItems.map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td className="font-mono text-[11.5px]">{row.hsCode}</td>
                      <td>{row.description}</td>
                      <td className="text-right tabular-nums">{row.qty}</td>
                      <td>{row.uom}</td>
                      <td className="text-right tabular-nums">{row.unitPrice}</td>
                      <td className="text-right tabular-nums">{row.invoiceValue}</td>
                      <td className="text-right tabular-nums">{row.taxableValueVnd}</td>
                      <td className="text-right tabular-nums">{row.importTaxPct}</td>
                      <td className="text-right tabular-nums">{row.importTaxVnd}</td>
                      <td className="text-right tabular-nums">{row.vatPct}</td>
                      <td className="text-right tabular-nums">{row.vatVnd}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#fbfcfd]">
                    <td colSpan={6} className="text-right font-semibold">{t("Total")}</td>
                    <td className="text-right font-semibold tabular-nums">{sumFormatted(profile.customsItems.map((r) => r.invoiceValue), 2)} USD</td>
                    <td className="text-right font-semibold tabular-nums">{sumFormatted(profile.customsItems.map((r) => r.taxableValueVnd), 0)}</td>
                    <td colSpan={2}></td>
                    <td colSpan={2} className="text-right font-semibold tabular-nums">{sumFormatted(profile.customsItems.map((r) => r.vatVnd), 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {docData && infoTab === "Bill of Lading" && renderGoodsTable(docData)}
      </div>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-sm shrink-0" />
          <div className="text-[13px] font-bold text-text-primary uppercase tracking-wide">{title}</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function groupFieldRows(fields: FieldRow[]): FieldRow[][] {
  const rows: FieldRow[][] = [];
  let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    const next = fields[i + 1];
    if (!f.wide && next && !next.wide) {
      rows.push([f, next]);
      i += 2;
    } else {
      rows.push([f]);
      i += 1;
    }
  }
  return rows;
}

function FieldGrid({ fields, editing = false, onChange }: { fields: FieldRow[]; editing?: boolean; onChange?: (index: number, value: string) => void }) {
  const { t } = useI18n();
  if (fields.length === 0) {
    return <div className="border border-border rounded-md py-4 text-center text-[12px] text-text-secondary">{t("No data available")}</div>;
  }
  const rows = groupFieldRows(fields);
  let cursor = 0;
  return (
    <div className="border border-border rounded-md overflow-hidden">
      {rows.map((row, ri) => {
        const startIdx = cursor;
        cursor += row.length;
        return (
          <div
            key={ri}
            className={`grid ${row.length === 2 ? "grid-cols-2 divide-x divide-border" : "grid-cols-1"} ${ri < rows.length - 1 ? "border-b border-border" : ""}`}
          >
            {row.map((f, ci) => {
              const idx = startIdx + ci;
              return (
                <div key={f.key} className="px-4 py-2.5">
                  <div className="text-[12px] text-text-secondary mb-1">{t(f.key)}</div>
                  {editing ? (
                    <input
                      value={f.value}
                      onChange={(e) => onChange?.(idx, e.target.value)}
                      className={`w-full h-7 px-2 border border-border rounded bg-white text-[13px] focus:outline-none focus:border-primary ${f.mono ? "font-mono text-[12px]" : ""}`}
                    />
                  ) : (
                    <div className={`text-[13px] font-semibold text-text-primary ${f.mono ? "font-mono text-[12px] font-normal" : ""}`}>{f.value}</div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function CellInput({ value, onChange, align = "left" }: { value: string; onChange: (v: string) => void; align?: "left" | "right" }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-6 px-1 border border-border rounded bg-white text-[12px] focus:outline-none focus:border-primary ${align === "right" ? "text-right tabular-nums" : ""}`}
    />
  );
}

/* ============== Matching Tab ============== */
type ItemResultFilter = "Matched" | "Mismatch" | "Unreconciled";

function MatchingTab({ profile, stage, setStage, phaseStatus }: { profile: InvoiceProfile; stage: StageTab; setStage: (s: StageTab) => void; phaseStatus: Record<StageTab, PhaseState> }) {
  const { t } = useI18n();
  const stageMeta: Record<StageTab, { label: string; desc: string; complete: boolean }> = {
    "Stage 1": { label: "Stage 1", desc: "Before GR (no Customs)", complete: profile.stageComplete["Stage 1"] },
    "Stage 2": { label: "Stage 2", desc: "Before GR (with Customs)", complete: profile.stageComplete["Stage 2"] },
    "Stage 3": { label: "Stage 3", desc: "After Goods Receipt", complete: profile.stageComplete["Stage 3"] },
  };

  const stageDocs = profile.stageDocs[stage];
  const stageBanners = profile.stageBanners[stage];
  const stageNotStarted = stageBanners.length === 0;

  const groupedDocs: { label: string; docNos: string }[] = [];
  for (const d of stageDocs) {
    const existing = groupedDocs.find((g) => g.label === d.label);
    if (existing) existing.docNos += `, ${d.docNo}`;
    else groupedDocs.push({ label: d.label, docNos: d.docNo });
  }

  const [statusFilters, setStatusFilters] = useState<Set<ItemResultFilter>>(
    new Set(["Matched", "Mismatch", "Unreconciled"])
  );
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set([1]));

  const toggleFilter = (f: ItemResultFilter) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const itemLineVisible = statusFilters.has("Matched");

  return (
    <div>
      {/* Stage tabs */}
      <div className="border-b border-border flex">
        {(Object.keys(stageMeta) as StageTab[]).map((s, i) => {
          const m = stageMeta[s];
          const isActive = stage === s;
          const notStarted = profile.stageBanners[s].length === 0;
          return (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`flex-1 min-w-0 text-left px-4 pt-3 pb-3 ${i > 0 ? "border-l border-border" : ""} ${
                notStarted ? "bg-white opacity-60" : isActive ? "bg-primary-light" : "bg-white hover:bg-muted"
              }`}
            >
              <div className="relative h-3 mb-2">
                <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] rounded-full ${!notStarted && isActive ? "bg-primary" : "bg-border"}`} />
                <div className={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${!notStarted && isActive ? "bg-primary" : "bg-border"}`} />
              </div>
              <div className={`text-[13px] font-medium inline-flex items-center gap-1.5 ${notStarted ? "text-text-secondary" : isActive ? "text-primary" : "text-text-primary"}`}>
                {t(m.label)}
                {phaseStatus[s].status === "Rejected" ? (
                  <XCircle className="h-3.5 w-3.5 text-error" />
                ) : (
                  m.complete && <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                )}
              </div>
              <div className="text-[11px] text-text-secondary mt-0.5">{t(m.desc)}</div>
            </button>
          );
        })}
      </div>

      <div className="p-4 space-y-4">
      {stageNotStarted ? (
        <div className="border border-border rounded-md bg-white flex flex-col items-center justify-center py-16 text-text-secondary">
          <Inbox className="h-8 w-8 mb-2 opacity-50" />
          <div className="text-[13px] font-medium">{t("No data yet")}</div>
          <div className="text-[11.5px] mt-1">{t("This stage has not started.")}</div>
        </div>
      ) : (
      <>
        {/* Reconciled Documents + Reconciliation Result, side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border rounded-md overflow-hidden">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>{t("Document Name")}</th>
                  <th>{t("Document Number")}</th>
                </tr>
              </thead>
              <tbody>
                {groupedDocs.map((d) => (
                  <tr key={d.label}>
                    <td className="font-medium">{t(d.label)}</td>
                    <td className="text-primary font-medium">{d.docNos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border border-border rounded-md p-3">
            <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">{t("Reconciliation Result")}</div>
            <div className="space-y-1.5">
              {stageBanners.map((b) => (
                <div
                  key={b.text}
                  className={`flex items-center gap-2 rounded px-2 py-1.5 text-[11.5px] ${
                    b.tone === "success" ? "bg-success-bg text-success"
                      : b.tone === "pending" ? "bg-warning-bg text-warning"
                      : "bg-muted text-text-secondary"
                  }`}
                >
                  {b.tone === "success" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Clock className="h-3.5 w-3.5 shrink-0" />}
                  <span>{t(b.text)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Header matching */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[12px] font-semibold text-text-primary">{t("Header Matching")}</div>
            <div className="text-[11px] text-text-secondary">{t("{n} criteria checked", { n: String(profile.headerMatchRows.length) })}</div>
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>{t("Criteria")}</th>
                  <th>{t("Invoice")}</th>
                  <th>PO</th>
                  <th>{t("Contract")}</th>
                  <th>BL</th>
                  <th>{t("Customs")}</th>
                  <th>GR</th>
                  <th>{t("Tolerance")}</th>
                  <th>{t("Result")}</th>
                </tr>
              </thead>
              <tbody>
                {profile.headerMatchRows.map((r) => (
                  <tr key={r[0]}>
                    <td className="font-medium">{t(r[0])}</td>
                    <td>{r[1]}</td>
                    <td>{r[2]}</td>
                    <td>{r[3]}</td>
                    <td>{r[4]}</td>
                    <td>{r[5]}</td>
                    <td>{r[6]}</td>
                    <td className="text-text-secondary">±0%</td>
                    <td><StatusBadge status="Matched" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Item matching */}
        <div>
          {/* Sub-tabs */}
          <div className="border-b border-border flex bg-[#fbfcfd] px-2">
            <button className="px-3 h-9 text-[12px] border-b-2 -mb-px whitespace-nowrap border-primary text-primary font-medium">
              {t("Reconciliation Details")}
            </button>
          </div>

          <div className="border border-t-0 border-border rounded-md">
            {/* Filter row */}
            <div className="flex items-center justify-between px-3 h-10 border-b border-border text-[12px]">
              <div className="text-text-secondary">
                {t("Invoice Date")}: <span className="text-text-primary font-medium">{(() => {
                  const iso = profile.infoData["Invoice"].header.find((f) => f.key === "Invoice Date")?.value;
                  return iso ? isoToDisplayDate(iso) : "—";
                })()}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-text-secondary">{t("Filter by status:")}</span>
                {([
                  { key: "Matched", color: "text-success" },
                  { key: "Mismatch", color: "text-error" },
                  { key: "Unreconciled", color: "text-text-secondary" },
                ] as { key: ItemResultFilter; color: string }[]).map(({ key, color }) => (
                  <label key={key} className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={statusFilters.has(key)}
                      onChange={() => toggleFilter(key)}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    <span className={color}>{key}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Expandable line-item table */}
            <table className="ent-table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>#</th>
                  <th>{t("Item Code")}</th>
                  <th>{t("Item Name")}</th>
                  <th>{t("UoM")}</th>
                  <th className="text-right">{t("Qty")}</th>
                  <th className="text-right">{t("Unit Price")}</th>
                  <th className="text-right">{t("Line Amount")}</th>
                  <th>{t("Result")}</th>
                  <th>{t("Notes")}</th>
                </tr>
              </thead>
              <tbody>
                {itemLineVisible && profile.itemMatchLines.map((line) => (
                  <Fragment key={line.id}>
                    <tr className="bg-success-bg/40 cursor-pointer hover:bg-success-bg/60" onClick={() => toggleRow(line.id)}>
                      <td>
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-primary text-primary">
                          <ChevronDown className={`h-2.5 w-2.5 transition-transform ${expandedRows.has(line.id) ? "" : "-rotate-90"}`} />
                        </span>
                      </td>
                      <td>{line.id}</td>
                      <td className="font-mono text-[11.5px] text-text-secondary">{line.itemCode}</td>
                      <td className="font-medium">{line.productName}</td>
                      <td>{line.uom}</td>
                      <td className="text-right tabular-nums">{line.qty}</td>
                      <td className="text-right tabular-nums">{line.unitPrice}</td>
                      <td className="text-right tabular-nums font-medium">{line.lineAmount}</td>
                      <td><StatusBadge status="Matched" /></td>
                      <td className="text-text-secondary">—</td>
                    </tr>
                    {expandedRows.has(line.id) && line.matchedDocs[stage].map((d) => (
                      <Fragment key={d.label}>
                        <tr className="bg-muted/60">
                          <td></td>
                          <td></td>
                          <td colSpan={2} className="font-medium text-text-primary">{t(d.label)} {t("No")} {d.docNo}</td>
                          <td></td>
                          <td className="text-right tabular-nums text-text-secondary">{d.qty}</td>
                          <td className="text-right tabular-nums text-text-secondary">{d.unitPrice}</td>
                          <td className="text-right tabular-nums font-medium">{d.lineAmount}</td>
                          <td></td>
                          <td></td>
                        </tr>
                        <tr className="bg-primary-light/30 text-text-secondary">
                          <td></td>
                          <td>{line.id}</td>
                          <td className="font-mono text-[11px] pl-4">{line.itemCode}</td>
                          <td className="pl-4">{line.productName}</td>
                          <td>{line.uom}</td>
                          <td className="text-right tabular-nums">{d.qty}</td>
                          <td className="text-right tabular-nums">{d.unitPrice}</td>
                          <td className="text-right tabular-nums">{d.lineAmount}</td>
                          <td></td>
                          <td></td>
                        </tr>
                      </Fragment>
                    ))}
                  </Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#fbfcfd]">
                  <td colSpan={5} className="text-right font-semibold">{t("Total")}</td>
                  <td className="text-right font-semibold tabular-nums">{itemLineVisible ? sumFormatted(profile.itemMatchLines.map((l) => l.qty), 0) : "0"}</td>
                  <td></td>
                  <td className="text-right font-semibold tabular-nums">{itemLineVisible ? `${sumFormatted(profile.itemMatchLines.map((l) => l.lineAmount), 2)} USD` : "0.00 USD"}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-3 h-10 border-t border-border text-[12px] text-text-secondary">
              <div>{t("Showing")} {itemLineVisible ? 1 : 0}–{itemLineVisible ? profile.itemMatchLines.length : 0} {t("of")} {itemLineVisible ? profile.itemMatchLines.length : 0} {t("results")}</div>
              <div className="flex items-center gap-1">
                <button className="h-6 w-6 inline-flex items-center justify-center border border-border bg-white rounded-md hover:bg-muted">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button className="h-6 w-6 border border-primary bg-primary-light text-primary rounded-md text-[11px] font-medium">1</button>
                <button className="h-6 w-6 inline-flex items-center justify-center border border-border bg-white rounded-md hover:bg-muted">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <select className="h-6 border border-border bg-white rounded-md text-[11px] ml-2">
                  <option>{t("25 / page")}</option>
                  <option>{t("50 / page")}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-text-secondary">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-success" /> {t("Matched")}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-warning" /> {t("Within tolerance")}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-error" /> {t("Mismatch")}</span>
          <span className="ml-auto">{t("Rule set:")} <span className="text-text-primary font-medium">IMPORT-5W-STANDARD v2.4</span></span>
        </div>
      </>
      )}
      </div>
    </div>
  );
}

function BottomActionBar({
  phaseState, stageComplete, approverName, approverTime, onReject, onOpenResetConfirm,
}: { phaseState: PhaseState; stageComplete: boolean; approverName: string; approverTime: string; onReject: () => void; onOpenResetConfirm: () => void }) {
  const { t } = useI18n();
  const isRejected = phaseState.status === "Rejected";
  return (
    <div className="border-t border-border bg-white px-4 h-12 flex items-center justify-between">
      <div className="text-[11.5px] text-text-secondary truncate">
        {isRejected ? (
          <span className="text-error font-medium">
            {t("This stage has been rejected")}
            {phaseState.reason ? ` · ${t("Reason")}: ${phaseState.reason}` : ""}
          </span>
        ) : stageComplete ? (
          <>{t("Ready for Finance approval · Merchandise confirmed by")} <span className="text-text-primary font-medium">{approverName}</span> {t("at")} {approverTime}</>
        ) : (
          <span>{t("Reconciliation in progress — not yet ready for Finance approval.")}</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isRejected ? (
          <button
            onClick={onOpenResetConfirm}
            className="h-8 px-3 bg-primary text-white rounded-full text-[12px] font-medium inline-flex items-center gap-1.5 hover:brightness-110"
          >
            <RotateCcw className="h-3.5 w-3.5" /> {t("Return to pending")}
          </button>
        ) : (
          <>
            <button className="h-8 px-3 border border-warning/40 text-warning bg-warning-bg rounded-full text-[12px] font-medium inline-flex items-center gap-1.5 hover:brightness-95">
              <Download className="h-3.5 w-3.5" /> {t("Export Report")}
            </button>
            <button
              onClick={onReject}
              className="h-8 px-3 border border-error/40 text-error bg-error-bg rounded-full text-[12px] font-medium inline-flex items-center gap-1.5 hover:brightness-95"
            >
              <XCircle className="h-3.5 w-3.5" /> {t("Reject")}
            </button>
            <button className="h-8 px-3 bg-primary text-white rounded-full text-[12px] font-medium inline-flex items-center gap-1.5 hover:brightness-110">
              <Check className="h-3.5 w-3.5" /> {t("Approve Matching")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ============== Activity Tab ============== */
function ActivityTab({ profile, extraEvents }: { profile: InvoiceProfile; extraEvents: ActivityEvent[] }) {
  const { t } = useI18n();
  const events = [...profile.activityEvents, ...extraEvents];
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[13px] font-semibold text-text-primary">{t("Activity Timeline")}</div>
          <div className="text-[11.5px] text-text-secondary">{t(profile.activityHeaderLabel, { n: String(events.length) })}</div>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-7 border border-border rounded bg-white text-[11.5px] px-2">
            <option>{t("All events")}</option>
            <option>{t("System")}</option>
            <option>{t("User")}</option>
          </select>
          <button className="h-7 px-2.5 border border-border bg-white rounded-md text-[11.5px] inline-flex items-center gap-1.5">
            <Download className="h-3 w-3" /> {t("Export")}
          </button>
        </div>
      </div>
      <div className="border border-border rounded-md bg-white">
        {events.map((e, i) => {
          const Icon = e.icon;
          const isUser = e.who.startsWith("Tran") || e.who.startsWith("Nguyen");
          return (
            <div key={i} className={`grid grid-cols-[70px_28px_1fr_140px] gap-3 px-3 py-2.5 ${i !== events.length - 1 ? "border-b border-border" : ""} hover:bg-[#fbfcfd]`}>
              <div className="text-[11.5px] text-text-secondary tabular-nums pt-0.5">{e.date} {e.t}</div>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center ${isUser ? "bg-primary-light text-primary" : "bg-muted text-text-secondary"}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-[12.5px] font-medium text-text-primary">{t(e.title)}</div>
                <div className="text-[11.5px] text-text-secondary mt-0.5">{t(e.desc)}</div>
              </div>
              <div className="text-[11.5px] text-text-secondary text-right pt-0.5">{e.who}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
