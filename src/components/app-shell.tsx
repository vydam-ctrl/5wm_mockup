import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard, FileText, FileCheck2, Boxes, Ship, ClipboardList,
  Building2, Users, Settings, BarChart3, Bell, Search, ChevronDown, HelpCircle, LayoutGrid, Languages,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, to: "#" },
  { label: "Invoice Management", icon: FileText, to: "/", active: true },
  { label: "Purchase Orders", icon: FileCheck2, to: "#" },
  { label: "Sales Contracts", icon: ClipboardList, to: "#" },
  { label: "Bill of Lading", icon: Ship, to: "#" },
  { label: "Customs Declaration", icon: Building2, to: "#" },
  { label: "Goods Receipt", icon: Boxes, to: "#" },
  { label: "Vendors", icon: Users, to: "#" },
  { label: "Reports", icon: BarChart3, to: "#" },
  { label: "Settings", icon: Settings, to: "#" },
];

export function AppShell({ children, breadcrumb }: { children: ReactNode; breadcrumb: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isInvoiceDetail = pathname.startsWith("/invoice");
  const { locale, toggleLocale, t } = useI18n();
  return (
    <div className="h-screen overflow-hidden flex bg-background text-text-primary">
      {/* Sidebar */}
      {!isInvoiceDetail && (
        <aside className="w-[220px] shrink-0 bg-white text-text-primary border-r border-border flex flex-col">
          <div className="h-12 px-4 flex items-center gap-2 border-b border-border">
            <div className="h-6 w-6 rounded-sm bg-primary flex items-center justify-center text-white font-bold text-[11px]">B</div>
            <div className="text-text-primary font-semibold text-[13px] tracking-wide">BIZZI ERP</div>
          </div>
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-secondary">{t("Import Operations")}</div>
          <nav className="flex-1 overflow-y-auto">
            {nav.map((item) => {
              const isActive = item.to === "/" ? pathname === "/" || pathname.startsWith("/invoice") : false;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to as string}
                  className={`flex items-center gap-2.5 px-4 py-2 text-[12.5px] border-l-2 ${
                    isActive
                      ? "bg-primary-light border-primary text-primary font-medium"
                      : "border-transparent text-text-primary hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t(item.label)}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border px-4 py-3 text-[11px] text-text-secondary">
            v4.12.0 · {t("Production")}
          </div>
        </aside>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-12 bg-white border-b border-border flex items-center px-4 gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative w-[320px]">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                placeholder={t("Search invoice, PO, contract, BL…")}
                className="w-full h-7 pl-8 pr-3 border border-border rounded-md text-[12px] bg-background focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <button className="text-text-secondary hover:text-text-primary"><HelpCircle className="h-4 w-4" /></button>
          <button className="relative text-text-secondary hover:text-text-primary">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-error text-white text-[9px] flex items-center justify-center">3</span>
          </button>
          <button className="text-text-secondary hover:text-text-primary"><LayoutGrid className="h-4 w-4" /></button>
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-[11px] font-medium"
          >
            <Languages className="h-4 w-4" />
            {locale === "en" ? "EN" : "VI"}
          </button>
          <div className="h-5 w-px bg-border" />
          <button className="flex items-center gap-2 text-[12px]">
            <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-semibold">NL</div>
            <span className="text-text-primary">Nguyen Thi Lan</span>
            <ChevronDown className="h-3 w-3 text-text-secondary" />
          </button>
        </header>

        {/* Breadcrumb bar */}
        <div className="h-9 bg-white border-b border-border px-4 flex items-center text-[12px] text-text-secondary">
          {breadcrumb}
        </div>

        <main className="flex-1 min-h-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const map: Record<string, string> = {
    "Approved": "bg-success-bg text-success",
    "Pending Approval": "bg-warning-bg text-warning",
    "Rejected": "bg-error-bg text-error",
    "Cancelled": "bg-muted text-text-secondary",
    "Matched": "bg-success-bg text-success",
    "Tolerance": "bg-warning-bg text-warning",
    "Mismatch": "bg-error-bg text-error",
  };
  return (
    <span className={`inline-flex items-center px-2 h-[20px] rounded-full text-[11px] font-medium leading-none ${map[status] ?? "bg-muted text-text-secondary"}`}>
      {t(status)}
    </span>
  );
}

export function MatchProgress({ matched, total }: { matched: number; total: number }) {
  const pct = (matched / total) * 100;
  const color = matched === total ? "bg-success" : matched >= 3 ? "bg-warning" : "bg-error";
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1.5 bg-muted rounded-sm overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-text-secondary tabular-nums">{matched}/{total}</span>
    </div>
  );
}
