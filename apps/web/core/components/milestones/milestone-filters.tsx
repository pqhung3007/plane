"use client";

import React from "react";
import { Filter, X, ArrowUpDown } from "lucide-react";
import { Menu } from "@headlessui/react";
// plane imports
import { Button } from "@plane/ui";
import type { TMilestoneStatus } from "@plane/types";

type TSortOption = "target_date_asc" | "target_date_desc" | "name_asc" | "name_desc" | "created_desc";

type Props = {
  selectedStatuses: TMilestoneStatus[];
  onStatusChange: (statuses: TMilestoneStatus[]) => void;
  sortBy: TSortOption;
  onSortChange: (sort: TSortOption) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
};

const statusOptions: { value: TMilestoneStatus; label: string; color: string }[] = [
  { value: "upcoming", label: "Upcoming", color: "text-blue-600" },
  { value: "active", label: "Active", color: "text-orange-600" },
  { value: "completed", label: "Completed", color: "text-green-600" },
  { value: "missed", label: "Missed", color: "text-red-600" },
];

const sortOptions: { value: TSortOption; label: string }[] = [
  { value: "target_date_asc", label: "Target date (earliest first)" },
  { value: "target_date_desc", label: "Target date (latest first)" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "created_desc", label: "Recently created" },
];

export const MilestoneFilters: React.FC<Props> = (props) => {
  const { selectedStatuses, onStatusChange, sortBy, onSortChange, onClearFilters, hasActiveFilters } = props;

  const toggleStatus = (status: TMilestoneStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const selectedSortOption = sortOptions.find((opt) => opt.value === sortBy);

  return (
    <div className="flex items-center gap-2">
      {/* Status Filter */}
      <Menu as="div" className="relative">
        <Menu.Button as="div">
          <Button
            variant="neutral-primary"
            size="sm"
            className={selectedStatuses.length > 0 ? "!border-custom-primary-100" : ""}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Status</span>
            {selectedStatuses.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-custom-primary-100/10 text-custom-primary-100">
                {selectedStatuses.length}
              </span>
            )}
          </Button>
        </Menu.Button>
        <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left rounded-md bg-custom-background-100 shadow-lg border border-custom-border-200 z-10">
          <div className="p-2 space-y-1">
            {statusOptions.map((option) => (
              <Menu.Item key={option.value}>
                {({ active }) => (
                  <button
                    onClick={() => toggleStatus(option.value)}
                    className={`${
                      active ? "bg-custom-background-90" : ""
                    } w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-custom-text-100`}
                  >
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center ${
                        selectedStatuses.includes(option.value)
                          ? "bg-custom-primary-100 border-custom-primary-100"
                          : "border-custom-border-300"
                      }`}
                    >
                      {selectedStatuses.includes(option.value) && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={option.color}>{option.label}</span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Menu>

      {/* Sort Dropdown */}
      <Menu as="div" className="relative">
        <Menu.Button as="div">
          <Button variant="neutral-primary" size="sm">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>{selectedSortOption?.label || "Sort"}</span>
          </Button>
        </Menu.Button>
        <Menu.Items className="absolute left-0 mt-2 w-64 origin-top-left rounded-md bg-custom-background-100 shadow-lg border border-custom-border-200 z-10">
          <div className="p-2 space-y-1">
            {sortOptions.map((option) => (
              <Menu.Item key={option.value}>
                {({ active }) => (
                  <button
                    onClick={() => onSortChange(option.value)}
                    className={`${
                      active ? "bg-custom-background-90" : ""
                    } ${
                      sortBy === option.value ? "bg-custom-primary-100/10 text-custom-primary-100" : ""
                    } w-full flex items-center justify-between rounded-md px-3 py-2 text-sm text-custom-text-100`}
                  >
                    <span>{option.label}</span>
                    {sortBy === option.value && (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Menu>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="neutral-primary" size="sm" onClick={onClearFilters}>
          <X className="h-3.5 w-3.5" />
          <span>Clear</span>
        </Button>
      )}
    </div>
  );
};
