export const SHIPMENT = {
  invoiceNo: "LH261730",
  invoiceDate: "05-Apr-2026",
  poNo: "26030025",
  contractNo: "—",
  blNo: "JTHPH26S03802",
  customsNo: "105678923420",
  grNo: "5000335133",
  blDate: "14-Apr-2026",
  grDate: "30-Apr-2026",
  receivedDate: "16-Apr-2026",
  processedDate: "16-Apr-2026 08:29",
  customsDate: "28-Apr-2026",
  currency: "USD",
  amount: "25,575.00",
  incoterm: "CIF Hai Phong",
  paymentTerm: "TT 30 Days From B/L Date",
  vendor: "QINHUANGDAO LIHUA STARCH CO., LTD.",
  vendorAddress: "No.89, Lihua Street, Funing District, Qinhuangdao City, Hebei Province, China",
  buyer: "ASIA CHEMICAL CORPORATION",
  buyerAddress: "Lot K4B, Le Minh Xuan Industrial Zone, Road No.4, Binh Loi Commune, Ho Chi Minh City, Vietnam",
  approver: "Nguyen Thi Lan",
  approvalDate: "16-Apr-2026",
  reference: "IMP-2026-Q2-0417",
  vessel: "LIANG XIANG 82 2606S",
  pol: "JINGTANG PORT, CHINA",
  pod: "HAIPHONG, VIETNAM",
  container: "2 x 40HC",
  grossWeight: "55,220 KGS",
  measurement: "100 CBM",
  freight: "FREIGHT PREPAID",
  product: "DEXTROSE MONOHYDRATE FOOD GRADE",
  qty: "55,000",
  unitPrice: "465.00",
  customsValueVnd: "668,274,750",
  vatVnd: "53,461,980",
  exchangeRate: "26,130",
  bank: "BANK OF CHINA, QINHUANGDAO BRANCH",
};

export type InvoiceRow = {
  invoiceNo: string;
  poNo: string;
  contractNo: string;
  blNo: string;
  customsNo: string;
  grNo: string;
  invoiceDate: string;
  blDate: string;
  grDate: string;
  receivedDate: string;
  processedDate: string;
  vendor: string;
  approver: string;
  approvalDate: string;
  reference: string;
  matched: number; // 0-5
  total: number;
  status: "Approved" | "Pending Approval" | "Rejected" | "Cancelled";
  amount: string;
  currency: string;
};

export const INVOICES: InvoiceRow[] = [
  {
    invoiceNo: "LH261730", poNo: "26030025", contractNo: "—",
    blNo: "JTHPH26S03802", customsNo: "105678923420", grNo: "5000335133",
    invoiceDate: "05-Apr-2026", blDate: "14-Apr-2026", grDate: "30-Apr-2026",
    receivedDate: "16-Apr-2026", processedDate: "16-Apr-2026 08:29",
    vendor: "Qinhuangdao Lihua Starch Co., Ltd.", approver: "Nguyen Thi Lan",
    approvalDate: "30-Apr-2026", reference: "IMP-2026-Q2-0417",
    matched: 5, total: 5, status: "Approved", amount: "25,575.00", currency: "USD",
  },
  {
    invoiceNo: "A03680", poNo: "26010550, 26010785, 26020191", contractNo: "—",
    blNo: "YOKDKK23592", customsNo: "108114267810", grNo: "—",
    invoiceDate: "02-Mar-2026", blDate: "12-Mar-2026", grDate: "—",
    receivedDate: "05-Apr-2026", processedDate: "05-Apr-2026 09:15",
    vendor: "Nikken Foods Co., Ltd.", approver: "—",
    approvalDate: "—", reference: "IMP-2026-Q1-0089",
    matched: 3, total: 5, status: "Pending Approval", amount: "24,322.00", currency: "USD",
  },
];
