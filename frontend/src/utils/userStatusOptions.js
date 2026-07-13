/*
|--------------------------------------------------------------------------
| ACCOUNT STATUS OPTIONS
|--------------------------------------------------------------------------
| Controls user lifecycle state (login + access control)
*/
export const ACCOUNT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
];

/*
|--------------------------------------------------------------------------
| APPROVAL STATUS OPTIONS
|--------------------------------------------------------------------------
| Controls onboarding / admin approval workflow only
*/
export const APPROVAL_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const STATUS_RULES = {
  onSuspend: {
    account_status: "suspended",
    // approval_status should NOT automatically change
  },

  onBan: {
    account_status: "banned",
    // approval_status should remain unchanged (important)
  },

  onApprove: {
    account_status: "active",
    approval_status: "approved",
  },

  onReject: {
    account_status: "inactive",
    approval_status: "rejected",
  },
};