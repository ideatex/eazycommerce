"use client";

import React from "react";
import { Search, ArrowUp, ArrowDown } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render: (item: T) => React.ReactNode;
}

export interface DataTableTab {
  id: string;
  label: string;
  count?: number;
}

export interface BulkAction {
  label: string;
  variant?: "default" | "danger";
  onClick: (ids: string[]) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T & string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  tabs?: DataTableTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  bulkActions?: BulkAction[];
  emptyMessage?: string;
}

const ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;

export function DataTable<T>({
  columns,
  data,
  keyField,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  tabs,
  activeTab,
  onTabChange,
  selectedIds,
  onSelect,
  sortColumn,
  sortDirection,
  onSort,
  bulkActions,
  emptyMessage = "No records match the current filters.",
}: DataTableProps<T>) {
  const selectable = !!onSelect && !!selectedIds;
  const ids = data.map((row) => String(row[keyField]));
  const allSelected = selectable && ids.length > 0 && ids.every((id) => selectedIds!.includes(id));

  const toggleAll = () => {
    if (!onSelect || !selectedIds) return;
    onSelect(allSelected ? selectedIds.filter((id) => !ids.includes(id)) : Array.from(new Set([...selectedIds, ...ids])));
  };

  const toggleOne = (id: string) => {
    if (!onSelect || !selectedIds) return;
    onSelect(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-subtle min-w-0">
      {(tabs || onSearchChange) && (
        <div className="p-3 border-b border-neutral-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {tabs ? (
            <div role="tablist" className="flex items-center gap-1 overflow-x-auto text-xs">
              {tabs.map((tab) => {
                const active = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => onTabChange?.(tab.id)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      active
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`ml-1.5 ${active ? "text-neutral-300" : "text-neutral-400"}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <span />
          )}
          {onSearchChange && (
            <div className="relative w-full lg:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full rounded-md border border-neutral-300 bg-white pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          )}
        </div>
      )}

      {selectable && bulkActions && selectedIds!.length > 0 && (
        <div className="px-4 py-2 bg-neutral-900 text-white text-xs flex flex-wrap items-center gap-3">
          <span className="font-semibold">{selectedIds!.length} selected</span>
          {bulkActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => action.onClick(selectedIds!)}
              className={`font-semibold underline underline-offset-2 ${
                action.variant === "danger" ? "text-rose-300" : "text-white"
              }`}
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onSelect!([])}
            className="ml-auto text-neutral-300 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
            <tr>
              {selectable && (
                <th className="w-10 py-2.5 px-4">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((col) => {
                const sorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`py-2.5 px-4 font-semibold text-[11px] ${ALIGN[col.align || "left"]}`}
                    aria-sort={sorted ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-neutral-900"
                      >
                        {col.label}
                        {sorted &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          ))}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 text-center text-neutral-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const id = String(row[keyField]);
                return (
                  <tr key={id} className="hover:bg-neutral-50/70 align-middle">
                    {selectable && (
                      <td className="w-10 py-3 px-4">
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          checked={selectedIds!.includes(id)}
                          onChange={() => toggleOne(id)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={`py-3 px-4 ${ALIGN[col.align || "left"]}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
