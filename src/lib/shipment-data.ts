export const SHIPMENT = {
  invoiceNo: "LH261730",
  invoiceDate: "05-Apr-2026",
  poNo: "4800018109",
  contractNo: "26030025",
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
    invoiceNo: "LH261730", poNo: "4800018109", contractNo: "26030025",
    blNo: "JTHPH26S03802", customsNo: "105678923420", grNo: "5000335133",
    invoiceDate: "05-Apr-2026", blDate: "14-Apr-2026", grDate: "30-Apr-2026",
    receivedDate: "16-Apr-2026", processedDate: "16-Apr-2026 08:29",
    vendor: "Qinhuangdao Lihua Starch Co., Ltd.", approver: "Nguyen Thi Lan",
    approvalDate: "30-Apr-2026", reference: "IMP-2026-Q2-0417",
    matched: 5, total: 5, status: "Approved", amount: "25,575.00", currency: "USD",
  },
  {
    invoiceNo: "LH261731", poNo: "4800018110", contractNo: "26030026",
    blNo: "140426JTHPH26S03803", customsNo: "105678923421", grNo: "—",
    invoiceDate: "07-Apr-2026", blDate: "16-Apr-2026", grDate: "—",
    receivedDate: "18-Apr-2026", processedDate: "18-Apr-2026 10:12",
    vendor: "Qinhuangdao Lihua Starch Co., Ltd.", approver: "Tran Van Minh",
    approvalDate: "—", reference: "IMP-2026-Q2-0421",
    matched: 4, total: 5, status: "Pending Approval", amount: "31,240.00", currency: "USD",
  },
  {
    invoiceNo: "SH260988", poNo: "4800018095", contractNo: "26030019",
    blNo: "SHA-JTHPH-260401", customsNo: "105678923402", grNo: "5000335120",
    invoiceDate: "28-Mar-2026", blDate: "02-Apr-2026", grDate: "22-Apr-2026",
    receivedDate: "05-Apr-2026", processedDate: "05-Apr-2026 09:44",
    vendor: "Shandong Huarui Chemicals Co., Ltd.", approver: "Pham Hoang Anh",
    approvalDate: "22-Apr-2026", reference: "IMP-2026-Q2-0388",
    matched: 5, total: 5, status: "Approved", amount: "48,910.00", currency: "USD",
  },
  {
    invoiceNo: "TJ260455", poNo: "4800018102", contractNo: "26030022",
    blNo: "TJX-HPH-260410", customsNo: "105678923415", grNo: "—",
    invoiceDate: "02-Apr-2026", blDate: "10-Apr-2026", grDate: "—",
    receivedDate: "12-Apr-2026", processedDate: "12-Apr-2026 14:03",
    vendor: "Tianjin Global Trading Co., Ltd.", approver: "—",
    approvalDate: "—", reference: "IMP-2026-Q2-0402",
    matched: 3, total: 5, status: "Pending Approval", amount: "12,860.00", currency: "USD",
  },
  {
    invoiceNo: "GD260112", poNo: "4800018077", contractNo: "26030011",
    blNo: "GZH-HPH-260320", customsNo: "105678923388", grNo: "—",
    invoiceDate: "15-Mar-2026", blDate: "20-Mar-2026", grDate: "—",
    receivedDate: "22-Mar-2026", processedDate: "22-Mar-2026 16:55",
    vendor: "Guangdong Meihua Foodstuff Co., Ltd.", approver: "Le Thi Hoa",
    approvalDate: "—", reference: "IMP-2026-Q1-0301",
    matched: 2, total: 5, status: "Rejected", amount: "8,420.00", currency: "USD",
  },
  {
    invoiceNo: "LH261720", poNo: "4800018050", contractNo: "26030008",
    blNo: "140326JTHPH26S03701", customsNo: "—", grNo: "—",
    invoiceDate: "10-Mar-2026", blDate: "18-Mar-2026", grDate: "—",
    receivedDate: "20-Mar-2026", processedDate: "20-Mar-2026 11:22",
    vendor: "Qinhuangdao Lihua Starch Co., Ltd.", approver: "—",
    approvalDate: "—", reference: "IMP-2026-Q1-0278",
    matched: 0, total: 5, status: "Cancelled", amount: "19,750.00", currency: "USD",
  },
  {
    invoiceNo: "ZJ260078", poNo: "4800018088", contractNo: "26030016",
    blNo: "ZJX-HPH-260405", customsNo: "105678923395", grNo: "5000335108",
    invoiceDate: "22-Mar-2026", blDate: "05-Apr-2026", grDate: "20-Apr-2026",
    receivedDate: "07-Apr-2026", processedDate: "07-Apr-2026 08:11",
    vendor: "Zhejiang Sanhe Foodstuff Co., Ltd.", approver: "Nguyen Thi Lan",
    approvalDate: "20-Apr-2026", reference: "IMP-2026-Q2-0355",
    matched: 5, total: 5, status: "Approved", amount: "37,105.00", currency: "USD",
  },
];
