import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, StatusBadge, MatchProgress } from "@/components/app-shell";
import { INVOICES } from "@/lib/shipment-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight, Download, RefreshCw, Plus, Filter, ChevronDown, ChevronUp, Calendar,
  ChevronsUpDown, MoreHorizontal, SlidersHorizontal, X, ChevronLeft, Pin,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: InvoiceListPage,
});

const TABS = ["ALL", "PENDING APPROVAL", "APPROVED", "REJECTED", "CANCELLED"] as const;

function InvoiceListPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]>("ALL");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const rows = INVOICES.filter((r) => {
    if (tab === "ALL") return true;
    return r.status.toUpperCase() === tab;
  });

  return (
    <AppShell
      breadcrumb={
        <div className="flex items-center gap-1.5">
          <span>{t("Import Operations")}</span>
          <ChevronRight className="h-3 w-3" />
          <span>{t("Invoice Management")}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-text-primary font-medium">{t("Invoice List")}</span>
        </div>
      }
    >
      <div className="p-4 space-y-3">
        {/* Page title row */}
        <div>
          <h1 className="text-[16px] font-semibold text-text-primary">{t("Import 5-Way Matching · Invoices")}</h1>
          <p className="text-[12px] text-text-secondary mt-0.5">
            {t("Reconcile Commercial Invoice against PO, Contract, BL, Customs Declaration and Goods Receipt.")}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-border rounded-md">
          <div className="border-b border-border flex px-1">
            {TABS.map((tb) => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`px-4 h-11 text-[13px] border-b-2 -mb-px transition-colors ${
                  tab === tb
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-text-secondary font-medium hover:text-text-primary"
                }`}
              >
                {t(tb)}
              </button>
            ))}
          </div>

          {/* Filter bar */}
          <div className="border-b border-border">
            <div className="flex items-center gap-2 px-3 h-11">
              <Filter className="h-3.5 w-3.5 text-text-secondary shrink-0" />
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full bg-primary-light text-primary text-[12px] font-medium hover:brightness-95"
              >
                {t("Invoice Number: LH261730")}
                <X className="h-3 w-3" />
              </button>
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-dashed border-border text-text-secondary text-[12px] hover:border-primary hover:text-primary"
              >
                {t("Add filter criteria…")}
                <kbd className="text-[10px] text-text-secondary/70 border border-border rounded px-1">⌘K</kbd>
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setFiltersOpen(false)}
                className="text-[12px] text-text-secondary hover:text-primary"
              >
                {t("Clear")}
              </button>
            </div>
            {filtersOpen && (
              <div className="px-3 pb-3 pt-1 grid grid-cols-6 gap-x-3 gap-y-2 border-t border-border bg-[#fbfcfd]">
                {[
                  ["Invoice Number", "LH261730"],
                  ["PO Number", ""],
                  ["Contract Number", ""],
                  ["Bill of Lading No.", ""],
                  ["Customs Declaration No.", ""],
                  ["Goods Receipt No.", ""],
                ].map(([label, val]) => (
                  <Field key={label} label={label} value={val} />
                ))}
                {[
                  ["Invoice Date", ""],
                  ["BL Date", ""],
                  ["GR Date", ""],
                  ["Document Received Date", ""],
                  ["Processing Date", ""],
                  ["Approval Date", ""],
                ].map(([label]) => (
                  <Field key={label} label={label} date />
                ))}
                <Field label="Vendor" value="Qinhuangdao Lihua Starch Co., Ltd." select />
                <Field label="Approver" select />
                <Field label="Reference Code" />
                <Field label="Matching Information" value="Fully Matched" select />
                <Field label="Status" select />

                <div className="col-span-6 flex items-center justify-end gap-2 pt-1">
                  <button className="h-7 px-3 text-[12px] text-text-secondary hover:text-text-primary">{t("Reset")}</button>
                  <button className="h-7 px-3 border border-border bg-white rounded-md text-[12px]">{t("Save filter")}</button>
                  <button className="h-7 px-3 bg-primary text-white rounded-md text-[12px]">{t("Apply")}</button>
                </div>
              </div>
            )}
          </div>

          {/* Section header + toolbar */}
          <div className="flex items-center justify-between px-3 h-12 border-b border-border">
            <div className="text-[13px] font-semibold text-text-primary">{t("Invoice List")} ({rows.length})</div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 px-3 border border-border bg-white rounded-md text-[12px] inline-flex items-center gap-1.5 hover:bg-muted">
                    {t("Actions")} <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>{t("Approve selected")}</DropdownMenuItem>
                  <DropdownMenuItem>{t("Reject selected")}</DropdownMenuItem>
                  <DropdownMenuItem>{t("Export selected")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button className="h-8 px-3 border border-border bg-white rounded-md text-[12px] inline-flex items-center gap-1.5 hover:bg-muted">
                <Download className="h-3.5 w-3.5" /> {t("Export Excel")}
              </button>
              <button className="h-8 px-3 border border-border bg-white rounded-md text-[12px] inline-flex items-center gap-1.5 hover:bg-muted">
                <RefreshCw className="h-3.5 w-3.5" /> {t("Refresh")}
              </button>
              <button className="h-8 px-3 bg-primary text-white rounded-md text-[12px] inline-flex items-center gap-1.5 hover:brightness-110">
                <Plus className="h-3.5 w-3.5" /> {t("Create Invoice")}
              </button>
              <button className="h-8 w-8 border border-border bg-white rounded-md inline-flex items-center justify-center hover:bg-muted text-text-secondary">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="ent-table">
              <thead>
                <tr>
                  <th className="w-8"><input type="checkbox" /></th>
                  <th><Th label="Invoice No" sort /></th>
                  <th>{t("PO No")}</th>
                  <th>{t("Contract No")}</th>
                  <th>{t("BL No")}</th>
                  <th>{t("Customs No")}</th>
                  <th>{t("GR No")}</th>
                  <th><Th label="Invoice Date" sort filter /></th>
                  <th>{t("BL Date")}</th>
                  <th>{t("GR Date")}</th>
                  <th><Th label="Received" sort filter /></th>
                  <th><Th label="Processed" sort filter /></th>
                  <th><Th label="Vendor" sort /></th>
                  <th>{t("Approver")}</th>
                  <th>{t("Approval Date")}</th>
                  <th><Th label="Reference" pin /></th>
                  <th>{t("Matching Progress")}</th>
                  <th className="text-right">{t("Amount")}</th>
                  <th>{t("Status")}</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.invoiceNo} className="group">
                    <td><input type="checkbox" /></td>
                    <td>
                      <Link to="/invoice/$id" params={{ id: r.invoiceNo }} className="text-primary hover:underline font-medium">
                        {r.invoiceNo}
                      </Link>
                    </td>
                    <td>{r.poNo}</td>
                    <td>{r.contractNo}</td>
                    <td className="font-mono text-[11.5px]">{r.blNo}</td>
                    <td className="font-mono text-[11.5px]">{r.customsNo}</td>
                    <td>{r.grNo}</td>
                    <td>{r.invoiceDate}</td>
                    <td>{r.blDate}</td>
                    <td>{r.grDate}</td>
                    <td>{r.receivedDate}</td>
                    <td>{r.processedDate}</td>
                    <td className="max-w-[200px] truncate" title={r.vendor}>{r.vendor}</td>
                    <td>{r.approver}</td>
                    <td>{r.approvalDate}</td>
                    <td>{r.reference}</td>
                    <td><MatchProgress matched={r.matched} total={r.total} /></td>
                    <td className="text-right tabular-nums font-medium">{r.amount} <span className="text-text-secondary">{r.currency}</span></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted text-text-secondary opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>{t("View")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("Edit")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("Cancel")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-3 h-10 border-t border-border text-[12px] text-text-secondary">
            <div>{t("Showing")} 1–{rows.length} {t("of")} {rows.length} {t("results")}</div>
            <div className="flex items-center gap-1">
              <button className="h-6 w-6 inline-flex items-center justify-center border border-border bg-white rounded-md hover:bg-muted">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button className="h-6 w-6 border border-primary bg-primary-light text-primary rounded-md text-[11px] font-medium">1</button>
              <button className="h-6 w-6 border border-border bg-white rounded-md text-[11px] hover:bg-muted">2</button>
              <button className="h-6 w-6 border border-border bg-white rounded-md text-[11px] hover:bg-muted">3</button>
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
    </AppShell>
  );
}

function Th({ label, sort = false, filter = false, pin = false }: { label: string; sort?: boolean; filter?: boolean; pin?: boolean }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1">
      {t(label)}
      {sort && <ChevronsUpDown className="h-3 w-3 text-text-secondary/60 cursor-pointer hover:text-text-secondary" />}
      {filter && <Filter className="h-3 w-3 text-text-secondary/60 cursor-pointer hover:text-text-secondary" />}
      {pin && <Pin className="h-3 w-3 text-text-secondary/60 cursor-pointer hover:text-text-secondary" />}
    </span>
  );
}

function Field({ label, value = "", date = false, select = false }: { label: string; value?: string; date?: boolean; select?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-text-secondary">{t(label)}</label>
      <div className="relative">
        <input
          defaultValue={value}
          placeholder={select ? t("Select…") : date ? t("dd-mmm-yyyy") : t("Enter value")}
          className="w-full h-7 px-2 pr-6 border border-border rounded bg-white text-[12px] focus:outline-none focus:border-primary"
        />
        {date && <Calendar className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary" />}
        {select && <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary" />}
      </div>
    </div>
  );
}
