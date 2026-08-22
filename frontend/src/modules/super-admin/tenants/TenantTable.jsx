import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import useTenant from "../../../hooks/useTenant";

/*
|--------------------------------------------------------------------------
| TENANT TABLE
|--------------------------------------------------------------------------
*/

const TenantTable = ({
  tenants = [],
  loading = false,
  onDelete,
  onRefresh,
  pagination = {},
  onPageChange,
}) => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | TENANT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    removeTenant,
    deleting,
    deleteError,
  } = useTenant();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [openMenu, setOpenMenu] = useState(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const currentPage = Number(
    pagination?.current_page ??
      pagination?.currentPage ??
      1
  );

  const lastPage = Number(
    pagination?.last_page ??
      pagination?.lastPage ??
      1
  );

  const total = Number(
    pagination?.total ??
      tenants.length ??
      0
  );

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const filteredTenants = useMemo(() => {
    const query = String(search || "")
      .trim()
      .toLowerCase();

    if (!query) {
      return Array.isArray(tenants)
        ? tenants
        : [];
    }

    return (Array.isArray(tenants)
      ? tenants
      : []
    ).filter((tenant) => {
      const values = [
        tenant?.id,
        tenant?.tenant_number,
        tenant?.first_name,
        tenant?.last_name,
        tenant?.other_names,
        tenant?.full_name,
        tenant?.email,
        tenant?.user?.email,
        tenant?.phone,
        tenant?.user?.phone,
        tenant?.status,
        tenant?.tenant_status,
        tenant?.account_status,
      ];

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [tenants, search]);

  /*
  |--------------------------------------------------------------------------
  | TENANT NAME
  |--------------------------------------------------------------------------
  */

  const getTenantName = (tenant) => {
    if (tenant?.full_name) {
      return tenant.full_name;
    }

    if (tenant?.user?.full_name) {
      return tenant.user.full_name;
    }

    const name = [
      tenant?.first_name,
      tenant?.other_names,
      tenant?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (name) {
      return name;
    }

    const userName = [
      tenant?.user?.first_name,
      tenant?.user?.other_names,
      tenant?.user?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return userName || "Unknown Tenant";
  };

  /*
  |--------------------------------------------------------------------------
  | INITIALS
  |--------------------------------------------------------------------------
  */

  const getInitials = (tenant) => {
    const first =
      tenant?.first_name ||
      tenant?.user?.first_name ||
      "";

    const last =
      tenant?.last_name ||
      tenant?.user?.last_name ||
      "";

    const initials =
      `${String(first).charAt(0)}${String(
        last
      ).charAt(0)}`.toUpperCase();

    return initials || "T";
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const normalizeStatus = (tenant) => {
    const status =
      tenant?.status ||
      tenant?.tenant_status ||
      tenant?.account_status ||
      "";

    /*
     * Prevent React from attempting to render an object.
     */
    if (
      typeof status === "object" &&
      status !== null
    ) {
      return String(
        status?.value ||
          status?.name ||
          status?.label ||
          ""
      ).toLowerCase();
    }

    return String(status).toLowerCase();
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS CLASSES
  |--------------------------------------------------------------------------
  */

  const getStatusClasses = (tenant) => {
    const status = normalizeStatus(tenant);

    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 ring-green-600/20";

      case "blacklisted":
        return "bg-red-50 text-red-700 ring-red-600/20";

      case "inactive":
        return "bg-gray-100 text-gray-700 ring-gray-500/20";

      case "pending":
        return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";

      default:
        return "bg-gray-100 text-gray-700 ring-gray-500/20";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT STATUS
  |--------------------------------------------------------------------------
  */

  const formatStatus = (tenant) => {
    const status = normalizeStatus(tenant);

    if (!status) {
      return "Unknown";
    }

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  /*
  |--------------------------------------------------------------------------
  | VIEW TENANT
  |--------------------------------------------------------------------------
  */

  const handleView = (tenant) => {
    setOpenMenu(null);

    const tenantId = tenant?.id;

    if (!tenantId) {
      Swal.fire({
        icon: "error",
        title: "Unable to view tenant",
        text: "The tenant ID is missing.",
        confirmButtonText: "OK",
      });

      return;
    }

    navigate(
      `/super-admin/tenants/${tenantId}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT TENANT
  |--------------------------------------------------------------------------
  */

  const handleEdit = (tenant) => {
    setOpenMenu(null);

    const tenantId = tenant?.id;

    if (!tenantId) {
      Swal.fire({
        icon: "error",
        title: "Unable to edit tenant",
        text: "The tenant ID is missing.",
        confirmButtonText: "OK",
      });

      return;
    }

    navigate(
      `/super-admin/tenants/${tenantId}/edit`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE TENANT
  |--------------------------------------------------------------------------
  |
  | Flow:
  |
  | TenantTable
  |     ↓
  | removeTenant()
  |     ↓
  | Redux deleteTenant()
  |     ↓
  | tenantService.deleteTenant()
  |     ↓
  | tenantAPI.deleteTenant()
  |     ↓
  | DELETE /api/tenants/{id}
  |
  */

  const handleDelete = async (tenant) => {
    setOpenMenu(null);

    const tenantId = tenant?.id;

    /*
     * Validate ID.
     */
    if (!tenantId) {
      await Swal.fire({
        icon: "error",
        title: "Unable to delete tenant",
        text: "The tenant ID is missing.",
        confirmButtonText: "OK",
      });

      return;
    }

    const tenantName =
      getTenantName(tenant);

    const tenantNumber =
      tenant?.tenant_number ||
      tenantId;

    /*
     * Confirmation dialog.
     */
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete Tenant?",
      html: `
        <div style="text-align:center">
          <p style="margin-bottom:8px;">
            Are you sure you want to delete
            <strong>${tenantName}</strong>?
          </p>

          <p style="font-size:13px;color:#6b7280;">
            Tenant Number:
            <strong>${tenantNumber}</strong>
          </p>

          <p style="font-size:13px;color:#dc2626;margin-top:12px;">
            This will remove the tenant from the active
            tenant list.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    /*
     * User cancelled.
     */
    if (!confirmation.isConfirmed) {
      return;
    }

    /*
     * Start deleting.
     */
    setDeletingId(tenantId);

    /*
     * Loading alert.
     */
    Swal.fire({
      title: "Deleting Tenant...",
      text: `Removing ${tenantName}`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      let result;

      /*
       * Parent callback has priority.
       */
      if (typeof onDelete === "function") {
        result = await onDelete(tenant);
      } else {
        result = await removeTenant(tenantId);
      }

      /*
       * IMPORTANT:
       *
       * Redux Toolkit dispatch().unwrap() normally returns
       * the fulfilled thunk payload.
       *
       * Depending on useTenant(), result can therefore be:
       *
       * {
       *   tenantId,
       *   message: "Tenant deleted successfully."
       * }
       *
       * or:
       *
       * "Tenant deleted successfully."
       *
       * or:
       *
       * {
       *   data: {...},
       *   message: "Tenant deleted successfully."
       * }
       */

      console.log("Tenant deletion response:", result);

      /*
       * Extract a clean success message.
       */
      const successMessage =
        result?.message ||
        result?.data?.message ||
        (typeof result === "string"
          ? result
          : null) ||
        "Tenant deleted successfully.";

      /*
       * Close loading alert.
       */
      Swal.close();

      /*
       * Success notification.
       */
      await Swal.fire({
        icon: "success",
        title: "Tenant Deleted",
        text: successMessage,
        confirmButtonText: "OK",
        confirmButtonColor: "#16a34a",
        timer: 2500,
        timerProgressBar: true,
      });

      /*
       * Refresh table after successful deletion.
       */
      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (error) {
      console.error(
        "Tenant deletion failed:",
        error
      );

      /*
       * Close loading alert.
       */
      Swal.close();

      /*
       * Extract backend error.
       */
      const message =
        error?.message ||
        error?.error ||
        error?.response?.data?.message ||
        error?.response?.data?.errors?.error ||
        deleteError ||
        "Failed to delete tenant.";

      /*
       * Error notification.
       */
      await Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: message,
        confirmButtonText: "OK",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    setOpenMenu(null);

    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PAGE CHANGE
  |--------------------------------------------------------------------------
  */

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > lastPage ||
      page === currentPage
    ) {
      return;
    }

    setOpenMenu(null);

    if (typeof onPageChange === "function") {
      onPageChange(page);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | EMPTY STATE
  |--------------------------------------------------------------------------
  */

  const isEmpty =
    !loading &&
    filteredTenants.length === 0;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ------------------------------------------------------------------
          TABLE HEADER
      ------------------------------------------------------------------ */}

      <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* TITLE */}

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Tenant List
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage registered tenants and their
              account information.
            </p>
          </div>

          {/* ACTIONS */}

          <div className="flex flex-col gap-2 sm:flex-row">

            {/* SEARCH */}

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search tenants..."
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  pl-9
                  pr-9
                  text-sm
                  text-gray-900
                  outline-none
                  placeholder:text-gray-400
                  focus:border-primary-500
                  focus:ring-2
                  focus:ring-primary-500/20
                  sm:w-64
                "
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="
                    absolute
                    right-2
                    top-1/2
                    flex
                    h-6
                    w-6
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-md
                    text-gray-400
                    hover:bg-gray-100
                    hover:text-gray-600
                  "
                  aria-label="Clear search"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                loading ||
                deleting
              }
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-gray-300
                bg-white
                px-3
                text-sm
                font-medium
                text-gray-700
                transition
                hover:bg-gray-50
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/20
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          LOADING
      ------------------------------------------------------------------ */}

      {loading && (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>

            <p className="mt-3 text-sm font-medium text-gray-900">
              Loading tenants...
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Please wait while we fetch tenant
              records.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------
          EMPTY
      ------------------------------------------------------------------ */}

      {isEmpty && (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            {search ? (
              <Search className="h-7 w-7" />
            ) : (
              <UsersIcon />
            )}
          </div>

          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            {search
              ? "No tenants found"
              : "No tenants available"}
          </h3>

          <p className="mt-1 max-w-md text-sm text-gray-500">
            {search
              ? "Try changing your search criteria."
              : "There are currently no tenant records to display."}
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------
          TABLE
      ------------------------------------------------------------------ */}

      {!loading &&
        filteredTenants.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">
                  <tr>

                    <th
                      scope="col"
                      className="
                        px-4
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-500
                        sm:px-6
                      "
                    >
                      Tenant
                    </th>

                    <th
                      scope="col"
                      className="
                        px-4
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-500
                      "
                    >
                      Tenant Number
                    </th>

                    <th
                      scope="col"
                      className="
                        px-4
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-500
                      "
                    >
                      Phone
                    </th>

                    <th
                      scope="col"
                      className="
                        px-4
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-500
                      "
                    >
                      Status
                    </th>

                    <th
                      scope="col"
                      className="
                        px-4
                        py-3
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-500
                      "
                    >
                      Verification
                    </th>

                    <th
                      scope="col"
                      className="
                        px-4
                        py-3
                        text-right
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-500
                      "
                    >
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">

                  {filteredTenants.map(
                    (tenant) => {
                      const tenantId =
                        tenant?.id;

                      const name =
                        getTenantName(
                          tenant
                        );

                      const isDeleting =
                        deletingId ===
                        tenantId;

                      return (
                        <tr
                          key={
                            tenantId ||
                            tenant?.tenant_number ||
                            name
                          }
                          className="transition hover:bg-gray-50"
                        >

                          {/* TENANT */}

                          <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                                {getInitials(
                                  tenant
                                )}
                              </div>

                              <div className="min-w-0">

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleView(
                                      tenant
                                    )
                                  }
                                  disabled={
                                    isDeleting
                                  }
                                  className="
                                    truncate
                                    text-left
                                    text-sm
                                    font-semibold
                                    text-gray-900
                                    hover:text-primary-600
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                  "
                                >
                                  {name}
                                </button>

                                <p className="truncate text-xs text-gray-500">
                                  {tenant?.email ||
                                    tenant?.user
                                      ?.email ||
                                    "No email address"}
                                </p>

                              </div>
                            </div>
                          </td>

                          {/* TENANT NUMBER */}

                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                            {tenant?.tenant_number ||
                              tenantId ||
                              "—"}
                          </td>

                          {/* PHONE */}

                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                            {tenant?.phone ||
                              tenant?.user?.phone ||
                              "—"}
                          </td>

                          {/* STATUS */}

                          <td className="whitespace-nowrap px-4 py-4">

                            <span
                              className={`
                                inline-flex
                                items-center
                                rounded-full
                                px-2.5
                                py-1
                                text-xs
                                font-medium
                                ring-1
                                ring-inset
                                ${getStatusClasses(
                                  tenant
                                )}
                              `}
                            >

                              {normalizeStatus(
                                tenant
                              ) ===
                              "active" ? (
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              ) : normalizeStatus(
                                  tenant
                                ) ===
                                "blacklisted" ? (
                                <XCircle className="mr-1 h-3.5 w-3.5" />
                              ) : (
                                <AlertCircle className="mr-1 h-3.5 w-3.5" />
                              )}

                              {formatStatus(
                                tenant
                              )}

                            </span>
                          </td>

                          {/* VERIFICATION */}

                          <td className="whitespace-nowrap px-4 py-4">

                            {tenant?.is_verified ||
                            tenant?.email_verified_at ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                                <CheckCircle2 className="h-4 w-4" />

                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                <XCircle className="h-4 w-4" />

                                Not Verified
                              </span>
                            )}

                          </td>

                          {/* ACTIONS */}

                          <td className="whitespace-nowrap px-4 py-4 text-right">

                            <div className="relative inline-block text-left">

                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMenu(
                                    openMenu ===
                                      tenantId
                                      ? null
                                      : tenantId
                                  )
                                }
                                disabled={
                                  isDeleting ||
                                  deleting
                                }
                                className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-lg
                                  border
                                  border-gray-300
                                  bg-white
                                  px-3
                                  py-2
                                  text-sm
                                  font-medium
                                  text-gray-700
                                  shadow-sm
                                  transition
                                  hover:bg-gray-50
                                  focus:outline-none
                                  focus:ring-2
                                  focus:ring-primary-500/20
                                  disabled:cursor-not-allowed
                                  disabled:opacity-60
                                "
                                aria-expanded={
                                  openMenu ===
                                  tenantId
                                }
                                aria-haspopup="menu"
                              >

                                {isDeleting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />

                                    <span>
                                      Deleting...
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <MoreHorizontal className="h-4 w-4" />

                                    <span className="hidden sm:inline">
                                      Actions
                                    </span>

                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </>
                                )}

                              </button>

                              {/* MENU */}

                              {openMenu ===
                                tenantId &&
                                !isDeleting && (
                                  <div
                                    className="
                                      absolute
                                      right-0
                                      z-50
                                      mt-2
                                      w-48
                                      origin-top-right
                                      rounded-xl
                                      border
                                      border-gray-200
                                      bg-white
                                      p-1
                                      text-left
                                      shadow-lg
                                      ring-1
                                      ring-black/5
                                    "
                                    role="menu"
                                  >

                                    {/* VIEW */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleView(
                                          tenant
                                        )
                                      }
                                      className="
                                        flex
                                        w-full
                                        items-center
                                        gap-3
                                        rounded-lg
                                        px-3
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-gray-700
                                        transition
                                        hover:bg-gray-50
                                      "
                                      role="menuitem"
                                    >
                                      <Eye className="h-4 w-4 text-gray-500" />

                                      View Tenant
                                    </button>

                                    {/* EDIT */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleEdit(
                                          tenant
                                        )
                                      }
                                      className="
                                        flex
                                        w-full
                                        items-center
                                        gap-3
                                        rounded-lg
                                        px-3
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-gray-700
                                        transition
                                        hover:bg-gray-50
                                      "
                                      role="menuitem"
                                    >
                                      <Pencil className="h-4 w-4 text-primary-600" />

                                      Edit Tenant
                                    </button>

                                    <div className="my-1 border-t border-gray-100" />

                                    {/* DELETE */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDelete(
                                          tenant
                                        )
                                      }
                                      disabled={
                                        deletingId !==
                                          null ||
                                        deleting
                                      }
                                      className="
                                        flex
                                        w-full
                                        items-center
                                        gap-3
                                        rounded-lg
                                        px-3
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-red-600
                                        transition
                                        hover:bg-red-50
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                      "
                                      role="menuitem"
                                    >

                                      {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}

                                      {isDeleting
                                        ? "Deleting..."
                                        : "Delete Tenant"}

                                    </button>

                                  </div>
                                )}

                            </div>
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>
              </table>
            </div>

            {/* ----------------------------------------------------------------
                PAGINATION
            ---------------------------------------------------------------- */}

            <div className="border-t border-gray-200 bg-white px-4 py-4 sm:px-6">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-700">
                    {filteredTenants.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-700">
                    {total}
                  </span>{" "}
                  tenants
                </p>

                {lastPage > 1 && (
                  <div className="flex items-center gap-2">

                    {/* PREVIOUS */}

                    <button
                      type="button"
                      onClick={() =>
                        handlePageChange(
                          currentPage - 1
                        )
                      }
                      disabled={
                        currentPage <= 1 ||
                        loading ||
                        deleting
                      }
                      className="
                        inline-flex
                        h-9
                        items-center
                        gap-1
                        rounded-lg
                        border
                        border-gray-300
                        bg-white
                        px-3
                        text-sm
                        font-medium
                        text-gray-700
                        transition
                        hover:bg-gray-50
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      <ChevronLeft className="h-4 w-4" />

                      <span className="hidden sm:inline">
                        Previous
                      </span>
                    </button>

                    {/* CURRENT PAGE */}

                    <span className="inline-flex h-9 items-center rounded-lg bg-primary-50 px-3 text-sm font-medium text-primary-700">
                      {currentPage} /{" "}
                      {lastPage}
                    </span>

                    {/* NEXT */}

                    <button
                      type="button"
                      onClick={() =>
                        handlePageChange(
                          currentPage + 1
                        )
                      }
                      disabled={
                        currentPage >=
                          lastPage ||
                        loading ||
                        deleting
                      }
                      className="
                        inline-flex
                        h-9
                        items-center
                        gap-1
                        rounded-lg
                        border
                        border-gray-300
                        bg-white
                        px-3
                        text-sm
                        font-medium
                        text-gray-700
                        transition
                        hover:bg-gray-50
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      <span className="hidden sm:inline">
                        Next
                      </span>

                      <ChevronRight className="h-4 w-4" />
                    </button>

                  </div>
                )}

              </div>
            </div>
          </>
        )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| EMPTY STATE ICON
|--------------------------------------------------------------------------
*/

const UsersIcon = () => (
  <CircleUserRound className="h-7 w-7" />
);

export default TenantTable;