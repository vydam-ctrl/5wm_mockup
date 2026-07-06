import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "en" | "vi";
const STORAGE_KEY = "bizzi.locale";

type I18nContextValue = {
  locale: Locale;
  toggleLocale: () => void;
  t: (text: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "vi" || saved === "en" ? saved : "en";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const toggleLocale = () => setLocale((l) => (l === "en" ? "vi" : "en"));

  const t = (text: string, vars?: Record<string, string | number>) => {
    let out = locale === "vi" ? VI_DICT[text] ?? text : text;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        out = out.split(`{${k}}`).join(String(v));
      }
    }
    return out;
  };

  return <LanguageContext.Provider value={{ locale, toggleLocale, t }}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}

const VI_DICT: Record<string, string> = {
  // ---- AppShell: nav ----
  "Dashboard": "Tổng quan",
  "Invoice Management": "Quản lý hóa đơn",
  "Purchase Orders": "Đơn đặt hàng",
  "Sales Contracts": "Hợp đồng mua bán",
  "Bill of Lading": "Vận đơn",
  "Customs Declaration": "Tờ khai hải quan",
  "Goods Receipt": "Phiếu nhập kho",
  "Vendors": "Nhà cung cấp",
  "Reports": "Báo cáo",
  "Settings": "Cài đặt",
  "Import Operations": "Vận hành nhập khẩu",
  "Search invoice, PO, contract, BL…": "Tìm hóa đơn, đơn hàng, hợp đồng, vận đơn…",
  "Production": "Chính thức",

  // ---- AppShell: status badge ----
  "Approved": "Đã duyệt",
  "Pending Approval": "Chờ duyệt",
  "Pending": "Chờ duyệt",
  "Rejected": "Từ chối",
  "Cancelled": "Đã hủy",
  "Matched": "Đã khớp",
  "Tolerance": "Trong ngưỡng",
  "Mismatch": "Không khớp",
  "Document Set Status": "Trạng thái bộ chứng từ",
  "Matching Stage": "Giai đoạn đối chiếu",

  // ---- Invoice list: breadcrumb / title ----
  "Invoice List": "Danh sách hóa đơn",
  "Import 5-Way Matching · Invoices": "Đối chiếu 5 chiều nhập khẩu · Hóa đơn",
  "Reconcile Commercial Invoice against PO, Contract, BL, Customs Declaration and Goods Receipt.":
    "Đối chiếu Hóa đơn thương mại với Đơn đặt hàng, Hợp đồng, Vận đơn, Tờ khai hải quan và Phiếu nhập kho.",

  // ---- Invoice list: status tabs (uppercase constants) ----
  "ALL": "TẤT CẢ",
  "PENDING APPROVAL": "CHỜ PHÊ DUYỆT",
  "APPROVED": "ĐÃ DUYỆT",
  "REJECTED": "TỪ CHỐI",
  "CANCELLED": "ĐÃ HỦY",

  // ---- Invoice list: filter bar ----
  "Invoice Number: LH261730": "Số hóa đơn: LH261730",
  "Add filter criteria…": "Thêm điều kiện lọc…",
  "Clear": "Xóa",
  "Reset": "Đặt lại",
  "Save filter": "Lưu bộ lọc",
  "Apply": "Áp dụng",
  "Select…": "Chọn…",
  "dd-mmm-yyyy": "ngày-tháng-năm",
  "Enter value": "Nhập giá trị",

  // ---- Invoice list: filter field labels ----
  "Invoice Number": "Số hóa đơn",
  "PO Number": "Số đơn đặt hàng",
  "Contract Number": "Số hợp đồng",
  "Order Number": "Số đơn hàng",
  "Bill of Lading No.": "Số vận đơn",
  "Customs Declaration No.": "Số tờ khai hải quan",
  "Goods Receipt No.": "Số phiếu nhập kho",
  "Invoice Date": "Ngày hóa đơn",
  "BL Date": "Ngày vận đơn",
  "GR Date": "Ngày nhập kho",
  "Document Received Date": "Ngày nhận chứng từ",
  "Processing Date": "Ngày xử lý",
  "Approval Date": "Ngày phê duyệt",
  "Vendor": "Nhà cung cấp",
  "Approver": "Người phê duyệt",
  "Reference Code": "Mã tham chiếu",
  "Matching Information": "Thông tin đối chiếu",
  "Status": "Trạng thái",

  // ---- Invoice list: toolbar ----
  "Actions": "Thao tác",
  "Approve selected": "Duyệt các mục đã chọn",
  "Reject selected": "Từ chối các mục đã chọn",
  "Export selected": "Xuất các mục đã chọn",
  "Export Excel": "Xuất Excel",
  "Refresh": "Làm mới",
  "Create Invoice": "Tạo hóa đơn",

  // ---- Invoice list: table headers ----
  "Invoice No": "Số hóa đơn",
  "PO No": "Số PO",
  "Contract No": "Số hợp đồng",
  "BL No": "Số BL",
  "Customs No": "Số TK",
  "GR No": "Số GR",
  "Received": "Ngày nhận",
  "Processed": "Ngày xử lý",
  "Reference": "Tham chiếu",
  "Matching Progress": "Tiến độ đối chiếu",
  "Amount": "Số tiền",

  // ---- Invoice list: row menu ----
  "View": "Xem",
  "Edit": "Sửa",
  "Cancel": "Hủy",
  "Save": "Lưu",
  "Add Row": "Thêm dòng",

  // ---- Pagination (shared list + matching table) ----
  "Showing": "Hiển thị",
  "of": "trong tổng số",
  "results": "kết quả",
  "25 / page": "25 / trang",
  "50 / page": "50 / trang",

  // ---- Invoice detail: breadcrumb / tabs ----
  "Information": "Thông tin",
  "Matching": "Đối chiếu",
  "Activity": "Hoạt động",
  "Purchase Order": "Đơn đặt hàng",
  "Sales Contract": "Hợp đồng mua bán",

  // ---- PdfViewer ----
  "Original document not available": "Tài liệu không có sẵn",
  "Original document file not found for {active}.": "Không tìm thấy file chứng từ gốc cho {active}.",
  "No data available": "Không có dữ liệu",
  "Hide original document": "Ẩn màn hình chứng từ gốc",
  "Show original document": "Hiện màn hình chứng từ gốc",

  // ---- Information tab: section titles ----
  "Header Information": "Thông tin chung",
  "Bank Information": "Thông tin ngân hàng",
  "Item Table": "Bảng chi tiết hàng hóa",

  // ---- Information tab: KV labels (Invoice) ----
  "Vendor Name": "Tên nhà cung cấp",
  "Buyer Name": "Tên người mua",
  "Currency": "Loại tiền",
  "Incoterms": "Điều kiện giao hàng",
  "Delivery Place": "Nơi giao hàng",
  "Payment Term": "Điều khoản thanh toán",
  "Total Amount": "Tổng số tiền",
  "Total Quantity": "Tổng số lượng",
  "Quantity UoM": "Đơn vị tính số lượng",
  "Net Weight": "Trọng lượng tịnh",
  "Transport Mode": "Phương thức vận chuyển",
  "Shipment Route": "Tuyến vận chuyển",
  "Beneficiary Name": "Tên người thụ hưởng",
  "Bank Name": "Tên ngân hàng",
  "SWIFT/BIC": "SWIFT/BIC",
  "Bank Account": "Số tài khoản",

  // ---- Information tab: KV labels (PO) ----
  "PO Date": "Ngày đơn đặt hàng",
  "Contract Date": "Ngày hợp đồng",
  "Buyer Tax Code": "Mã số thuế người mua",
  "Seller Name": "Tên người bán",
  "Seller Code": "Mã người bán",
  "Incoterm": "Điều kiện giao hàng",
  "Incoterm Location": "Địa điểm giao hàng (Incoterm)",
  "Shipment Mode": "Hình thức vận chuyển",
  "Port of Discharge": "Cảng dỡ hàng",
  "Requested ETD": "Ngày dự kiến khởi hành (ETD)",

  // ---- Information tab: KV labels (BL) ----
  "B/L Number": "Số vận đơn",
  "Shipper Name": "Tên người gửi hàng",
  "Shipper Address": "Địa chỉ người gửi hàng",
  "Consignee Name": "Tên người nhận hàng",
  "Consignee Address": "Địa chỉ người nhận hàng",
  "Notify Party": "Bên được thông báo",
  "Vessel / Voyage": "Tàu / Chuyến",
  "Place of Receipt": "Nơi nhận hàng",
  "Port of Loading": "Cảng xếp hàng",
  "Place of Delivery": "Nơi giao hàng",
  "Freight Term": "Điều kiện cước phí",
  "Laden On Board": "Ngày xếp hàng lên tàu",
  "B/L Issue": "Ngày phát hành vận đơn",
  "Gross Weight": "Trọng lượng cả bì",
  "Measurement": "Thể tích",
  "Total Packages": "Tổng số kiện",
  "Country of Origin": "Nước xuất xứ",
  "Description": "Mô tả",
  "Goods Description": "Mô tả hàng hóa",

  // ---- Information tab: KV labels (Customs) ----
  "Declaration Number": "Số tờ khai",
  "Type Code": "Mã loại hình",
  "Registration Date": "Ngày đăng ký",
  "Importer Name": "Tên người nhập khẩu",
  "Importer Tax Code": "Mã số thuế người nhập khẩu",
  "Exporter Name": "Tên người xuất khẩu",
  "Exporter Country": "Nước xuất khẩu",
  "Invoice Issue Date": "Ngày phát hành hóa đơn",
  "Invoice Value": "Trị giá hóa đơn",
  "Payment Method": "Phương thức thanh toán",
  "Cargo Arrival Date": "Ngày hàng đến",
  "Exchange Rate": "Tỷ giá",
  "Transport Means": "Phương tiện vận chuyển",
  "Loading Location": "Địa điểm xếp hàng",
  "Unloading Location": "Địa điểm dỡ hàng",
  "Taxable Value Total": "Tổng trị giá tính thuế",
  "VAT Amount Total": "Tổng tiền thuế GTGT",

  // ---- Information tab: item table headers ----
  "Product Name": "Tên sản phẩm",
  "Qty": "Số lượng",
  "UoM": "ĐVT",
  "Unit Price": "Đơn giá",
  "Line Amount": "Thành tiền",
  "Total": "Tổng cộng",
  "HS Code": "Mã HS",
  "Taxable Value (VND)": "Trị giá tính thuế (VND)",
  "Import Tax (%)": "Thuế NK (%)",
  "Import Tax (VND)": "Thuế NK (VND)",
  "VAT (%)": "Thuế GTGT (%)",
  "VAT (VND)": "Thuế GTGT (VND)",

  // ---- Matching tab ----
  "Stage 1": "Giai đoạn 1",
  "Stage 2": "Giai đoạn 2",
  "Stage 3": "Giai đoạn 3",
  "Before GR (no Customs)": "Trước khi nhập kho (chưa có tờ khai HQ)",
  "Before GR (with Customs)": "Trước khi nhập kho (đã có tờ khai HQ)",
  "After Goods Receipt": "Sau khi nhập kho",
  "Reconciliation Result": "Kết quả đối chiếu",
  "No data yet": "Chưa có dữ liệu",
  "This stage has not started.": "Giai đoạn này chưa bắt đầu.",
  "Matching Stage 1 completed — Invoice ↔ PO ↔ Contract ↔ BL reconciled. 100% matched.":
    "Hoàn tất đối chiếu Giai đoạn 1 — Hóa đơn ↔ PO ↔ Hợp đồng ↔ Vận đơn đã khớp. Khớp 100%.",
  "Matching Stage 2 completed — Customs Declaration added. All header + item lines matched.":
    "Hoàn tất đối chiếu Giai đoạn 2 — Đã bổ sung Tờ khai hải quan. Toàn bộ thông tin chung và chi tiết hàng hóa đã khớp.",
  "Matching Stage 3 completed — 5-Way match closed with zero variance.":
    "Hoàn tất đối chiếu Giai đoạn 3 — Đối chiếu 5 chiều hoàn tất, không có sai lệch.",
  "Matching Stage 1 completed — Invoice ↔ PO ↔ BL reconciled. 100% matched.":
    "Hoàn tất đối chiếu Giai đoạn 1 — Hóa đơn ↔ PO ↔ Vận đơn đã khớp. Khớp 100%.",
  "Tran Van Minh confirmed at 08:25 on 30-Apr-2026": "Tran Van Minh đã xác nhận lúc 08:25 ngày 30-04-2026",
  "Tran Van Minh confirmed at 10:25 on 03-May-2026": "Tran Van Minh đã xác nhận lúc 10:25 ngày 03-05-2026",
  "Tran Van Lai confirmed at 08:56 on 05-Feb-2026": "Tran Van Lai đã xác nhận lúc 08:56 ngày 05-02-2026",
  "Header Matching": "Đối chiếu thông tin chung",
  "{n} criteria checked": "Đã kiểm tra {n} tiêu chí",
  "Criteria": "Tiêu chí",
  "Invoice": "Hóa đơn",
  "Contract": "Hợp đồng",
  "Customs": "Hải quan",
  "Result": "Kết quả",
  "Buyer / Consignee": "Người mua / Người nhận hàng",
  "Bank": "Ngân hàng",
  "Shipment / Vessel": "Lô hàng / Tàu",
  "Container": "Container",
  "Invoice Amount": "Số tiền hóa đơn",
  "Document Name": "Tên chứng từ",
  "Document Number": "Số chứng từ",
  "Reconciliation Details": "Chi tiết đối chiếu",
  "Filter by status:": "Lọc theo trạng thái:",
  "Unreconciled": "Chưa đối chiếu",
  "Within tolerance": "Trong ngưỡng cho phép",
  "Rule set:": "Bộ quy tắc:",
  "Item Code": "Mã hàng",
  "Item Name": "Tên hàng",
  "Notes": "Ghi chú",
  "No": "Số",

  // ---- Bottom action bar ----
  "Ready for Finance approval · Merchandise confirmed by": "Sẵn sàng để Kế toán phê duyệt · Đã được xác nhận hàng hóa bởi",
  "Reconciliation in progress — not yet ready for Finance approval.": "Đang đối chiếu — chưa sẵn sàng để Kế toán phê duyệt.",
  "at": "lúc",
  "Rematch": "Đối chiếu lại",
  "Export Report": "Xuất báo cáo",
  "Merchandise Confirm": "Xác nhận hàng hóa",
  "Reject": "Từ chối",
  "Approve Matching": "Phê duyệt đối chiếu",

  // ---- Activity tab ----
  "Activity Timeline": "Nhật ký hoạt động",
  "30-Apr-2026 · {n} events": "30-04-2026 · {n} sự kiện",
  "{n} events": "{n} sự kiện",
  "All events": "Tất cả sự kiện",
  "System": "Hệ thống",
  "User": "Người dùng",
  "Export": "Xuất",
  "Webhook received": "Đã nhận Webhook",
  "Commercial Invoice synchronized": "Đã đồng bộ Hóa đơn thương mại",
  "Sales Contract synchronized": "Đã đồng bộ Hợp đồng mua bán",
  "Bill of Lading synchronized": "Đã đồng bộ Vận đơn",
  "Customs Declaration synchronized": "Đã đồng bộ Tờ khai hải quan",
  "OCR completed": "Hoàn tất OCR",
  "Matching Stage 1 completed": "Hoàn tất đối chiếu Giai đoạn 1",
  "Matching Stage 2 completed": "Hoàn tất đối chiếu Giai đoạn 2",
  "Goods Receipt synchronized": "Đã đồng bộ Phiếu nhập kho",
  "Matching Stage 3 completed": "Hoàn tất đối chiếu Giai đoạn 3",
  "Merchandise confirmed": "Đã xác nhận hàng hóa",
  "Finance approved": "Kế toán đã phê duyệt",
  "ERP posting completed": "Hoàn tất hạch toán ERP",
  "Inbound shipment notification LH261730 received via webhook.": "Đã nhận thông báo lô hàng đến LH261730 qua webhook.",
  "Invoice document downloaded from vendor portal.": "Đã tải hóa đơn từ cổng thông tin nhà cung cấp.",
  "Contract 26030025 attached to invoice.": "Đã đính kèm hợp đồng 26030025 vào hóa đơn.",
  "BL 140426JTHPH26S03802 received.": "Đã nhận vận đơn 140426JTHPH26S03802.",
  "Customs declaration 105678923420 linked.": "Đã liên kết tờ khai hải quan 105678923420.",
  "Structured extraction on 5 documents · 214 fields captured.": "Trích xuất dữ liệu có cấu trúc từ 5 chứng từ · thu được 214 trường dữ liệu.",
  "Invoice ↔ PO ↔ Contract ↔ BL reconciled. 100% matched.": "Đã đối chiếu Hóa đơn ↔ PO ↔ Hợp đồng ↔ Vận đơn. Khớp 100%.",
  "Customs Declaration added. All header + item lines matched.": "Đã bổ sung Tờ khai hải quan. Toàn bộ thông tin chung và chi tiết hàng hóa đã khớp.",
  "GR 5000335133 posted for 55,000 KG.": "Đã ghi nhận phiếu nhập kho 5000335133 cho 55.000 KG.",
  "5-Way match closed with zero variance.": "Đối chiếu 5 chiều hoàn tất, không có sai lệch.",
  "Quantities and quality verified against GR.": "Đã kiểm tra số lượng và chất lượng theo phiếu nhập kho.",
  "Approved for ERP posting. Payment scheduled 14-May-2026.": "Đã phê duyệt để hạch toán ERP. Lịch thanh toán ngày 14-05-2026.",
  "Document 5105003321 posted to company code 1000.": "Đã hạch toán chứng từ 5105003321 vào mã công ty 1000.",
  "Purchase Order synchronized": "Đã đồng bộ Đơn đặt hàng",
  "Matching Stage 2 in progress": "Đang đối chiếu Giai đoạn 2",
  "PO 26010550 (Vegetable Powder P007) received from vendor portal.": "Đã nhận PO 26010550 (Bột rau củ P007) từ cổng thông tin nhà cung cấp.",
  "PO 26010785 (Soy Sauce Powder A6016) received from vendor portal.": "Đã nhận PO 26010785 (Bột nước tương A6016) từ cổng thông tin nhà cung cấp.",
  "PO 26020191 (Meat Seasoning A6391) received from vendor portal.": "Đã nhận PO 26020191 (Gia vị thịt A6391) từ cổng thông tin nhà cung cấp.",
  "Invoice A03680 downloaded from vendor portal.": "Đã tải hóa đơn A03680 từ cổng thông tin nhà cung cấp.",
  "BL YOKDKK23592 received.": "Đã nhận vận đơn YOKDKK23592.",
  "Structured extraction on 5 documents · fields captured.": "Trích xuất dữ liệu có cấu trúc từ 5 chứng từ.",
  "Invoice ↔ PO ↔ BL reconciled. 100% matched.": "Đã đối chiếu Hóa đơn ↔ PO ↔ Vận đơn. Khớp 100%.",
  "Customs declaration 108114267810 linked.": "Đã liên kết tờ khai hải quan 108114267810.",
  "Customs Declaration added, pending Finance approval.": "Đã bổ sung Tờ khai hải quan, đang chờ Kế toán phê duyệt.",

  // ---- Reject invoice flow ----
  "Not Approved": "Không duyệt",
  "Reason for rejecting invoice": "Lý do không duyệt hóa đơn",
  "Add rejection reason...": "Thêm lý do từ chối...",
  "Close": "Đóng",
  "Confirm": "Xác nhận",
  "Reason is required": "Vui lòng nhập lý do",
  "Are you sure you want to": "Bạn có chắc chắn muốn",
  "not approve": "không duyệt",
  "this invoice?": "hóa đơn này??",
  "No, skip": "Không, bỏ qua",
  "Return to pending": "Chuyển về chờ duyệt",
  "Confirm return to pending?": "Bạn có chắc chắn muốn chuyển hóa đơn về trạng thái chờ duyệt?",
  "This stage has been rejected": "Giai đoạn này đã bị từ chối duyệt",
  "Reason": "Lý do",
  "Invoice rejected": "Hóa đơn bị từ chối duyệt",
  "Invoice returned to pending": "Hóa đơn được chuyển về chờ duyệt",

  // ---- Customs declaration variant toggle ----
  "Original Declaration": "Tờ khai gốc",
  "Adjusted Declaration": "Tờ khai điều chỉnh",
  "No adjusted declaration yet": "Chưa có tờ khai điều chỉnh",
};
