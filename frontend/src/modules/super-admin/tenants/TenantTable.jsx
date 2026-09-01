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

import {
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import Swal from "sweetalert2";

import useTenant from "../../../hooks/useTenant";

/*
|--------------------------------------------------------------------------
| TENANT TABLE
|--------------------------------------------------------------------------
|
| Responsibilities:
| - Display tenant records
| - Search currently loaded tenant records
| - Display tenant status
| - Display verification status
| - View tenant
| - Edit tenant
| - Delete tenant
| - Refresh tenant records
| - Handle pagination
| - Safely handle nested Laravel API responses
|
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
    deleting = false,
    deleteError = null,
  } = useTenant();

  /*
  |--------------------------------------------------------------------------
  | LOCAL UI STATE
  |--------------------------------------------------------------------------
  */

  const [openMenu, setOpenMenu] = useState(null);

  const [search, setSearch] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | SAFE TENANT ARRAY
  |--------------------------------------------------------------------------
  */

  const tenantList = useMemo(() => {
    return Array.isArray(tenants)
      ? tenants
      : [];
  }, [tenants]);

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
    tenantList.length ??
    0
  );

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE GENERIC VALUE
  |--------------------------------------------------------------------------
  |
  | Prevent React errors such as:
  |
  | Objects are not valid as a React child
  |
  */

  const normalizeValue = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    if (typeof value === "object") {
      return (
        value?.value ??
        value?.name ??
        value?.label ??
        value?.title ??
        ""
      );
    }

    return String(value);
  };

  /*
  |--------------------------------------------------------------------------
  | TENANT NAME
  |--------------------------------------------------------------------------
  */

  const getTenantName = (tenant) => {
    if (!tenant) {
      return "Unknown Tenant";
    }

    /*
     * Direct full name.
     */

    const fullName = normalizeValue(
      tenant?.full_name
    ).trim();

    if (fullName) {
      return fullName;
    }

    /*
     * Nested user full name.
     */

    const userFullName = normalizeValue(
      tenant?.user?.full_name
    ).trim();

    if (userFullName) {
      return userFullName;
    }

    /*
     * Direct tenant name fields.
     */

    const directName = [
      tenant?.first_name,
      tenant?.other_names,
      tenant?.last_name,
    ]
      .map(normalizeValue)
      .filter(Boolean)
      .join(" ")
      .trim();

    if (directName) {
      return directName;
    }

    /*
     * Nested user name fields.
     */

    const userName = [
      tenant?.user?.first_name,
      tenant?.user?.other_names,
      tenant?.user?.last_name,
    ]
      .map(normalizeValue)
      .filter(Boolean)
      .join(" ")
      .trim();

    if (userName) {
      return userName;
    }

    return "Unknown Tenant";
  };

  /*
  |--------------------------------------------------------------------------
  | TENANT EMAIL
  |--------------------------------------------------------------------------
  */

  const getTenantEmail = (tenant) => {
    const email =
      tenant?.email ??
      tenant?.user?.email ??
      "";

    const normalized = normalizeValue(
      email
    ).trim();

    return normalized || "No email address";
  };

  /*
  |--------------------------------------------------------------------------
  | TENANT PHONE
  |--------------------------------------------------------------------------
  */

  const getTenantPhone = (tenant) => {
    const phone =
      tenant?.phone ??
      tenant?.user?.phone ??
      tenant?.mobile ??
      tenant?.user?.mobile ??
      "";

    const normalized = normalizeValue(
      phone
    ).trim();

    return normalized || "—";
  };

  /*
  |--------------------------------------------------------------------------
  | TENANT NUMBER
  |--------------------------------------------------------------------------
  */

  const getTenantNumber = (tenant) => {
    const tenantNumber =
      tenant?.tenant_number ??
      tenant?.tenantNumber ??
      "";

    const normalized = normalizeValue(
      tenantNumber
    ).trim();

    return (
      normalized ||
      normalizeValue(tenant?.id) ||
      "—"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | INITIALS
  |--------------------------------------------------------------------------
  */

  const getInitials = (tenant) => {
    const first =
      normalizeValue(
        tenant?.first_name ??
        tenant?.user?.first_name
      ).trim();

    const last =
      normalizeValue(
        tenant?.last_name ??
        tenant?.user?.last_name
      ).trim();

    const firstInitial =
      first.charAt(0);

    const lastInitial =
      last.charAt(0);

    const initials =
      `${firstInitial}${lastInitial}`
        .toUpperCase();

    if (initials) {
      return initials;
    }

    /*
     * Fallback to full name.
     */

    const fullName =
      getTenantName(tenant);

    const nameParts =
      fullName
        .split(/\s+/)
        .filter(Boolean);

    if (nameParts.length >= 2) {
      return (
        `${nameParts[0].charAt(0)}${nameParts[
          nameParts.length - 1
        ].charAt(0)}`
      ).toUpperCase();
    }

    return (
      fullName
        .charAt(0)
        .toUpperCase() || "T"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const normalizeStatus = (tenant) => {
    if (!tenant) {
      return "";
    }

    let status =
      tenant?.status ??
      tenant?.tenant_status ??
      tenant?.account_status ??
      "";

    /*
     * Laravel may return:
     *
     * status: "active"
     *
     * or:
     *
     * status: {
     *   value: "active",
     *   label: "Active"
     * }
     */

    if (
      typeof status === "object" &&
      status !== null
    ) {
      status =
        status?.value ??
        status?.name ??
        status?.label ??
        status?.status ??
        "";
    }

    return normalizeValue(status)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS LABEL
  |--------------------------------------------------------------------------
  */

  const formatStatus = (tenant) => {
    const status =
      normalizeStatus(tenant);

    if (!status) {
      return "Unknown";
    }

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase()
      );
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS CLASSES
  |--------------------------------------------------------------------------
  */

  const getStatusClasses = (tenant) => {
    const status =
      normalizeStatus(tenant);

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
  | STATUS ICON
  |--------------------------------------------------------------------------
  */

  const getStatusIcon = (tenant) => {
    const status =
      normalizeStatus(tenant);

    if (status === "active") {
      return (
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
      );
    }

    if (status === "blacklisted") {
      return (
        <XCircle className="mr-1 h-3.5 w-3.5" />
      );
    }

    return (
      <AlertCircle className="mr-1 h-3.5 w-3.5" />
    );
  };

  /*
  |--------------------------------------------------------------------------
  | VERIFICATION
  |--------------------------------------------------------------------------
  */

  const isTenantVerified = (tenant) => {
    if (!tenant) {
      return false;
    }

    /*
     * Direct boolean.
     */

    if (
      tenant?.is_verified === true ||
      tenant?.verified === true
    ) {
      return true;
    }

    /*
     * Numeric API representation.
     */

    if (
      tenant?.is_verified === 1 ||
      tenant?.verified === 1
    ) {
      return true;
    }

    /*
     * String API representation.
     */

    const verifiedValue =
      normalizeValue(
        tenant?.is_verified ??
        tenant?.verified
      ).toLowerCase();

    if (
      [
        "true",
        "1",
        "yes",
        "verified",
      ].includes(verifiedValue)
    ) {
      return true;
    }

    /*
     * Laravel email verification.
     */

    if (
      tenant?.email_verified_at ||
      tenant?.user?.email_verified_at
    ) {
      return true;
    }

    return false;
  };

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  |
  | This searches the records already loaded into the table.
  |
  | Server-side filtering remains controlled by TenantList.
  |
  */

  const filteredTenants = useMemo(() => {
    const query =
      String(search || "")
        .trim()
        .toLowerCase();

    if (!query) {
      return tenantList;
    }

    return tenantList.filter(
      (tenant) => {
        const values = [
          tenant?.id,
          tenant?.tenant_number,
          tenant?.tenantNumber,
          tenant?.first_name,
          tenant?.last_name,
          tenant?.other_names,
          tenant?.full_name,
          tenant?.email,
          tenant?.user?.email,
          tenant?.phone,
          tenant?.user?.phone,
          tenant?.mobile,
          tenant?.user?.mobile,
          tenant?.status,
          tenant?.tenant_status,
          tenant?.account_status,
        ];

        return values.some(
          (value) => {
            const normalized =
              normalizeValue(
                value
              ).toLowerCase();

            return normalized.includes(
              query
            );
          }
        );
      }
    );
  }, [
    tenantList,
    search,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SAFE TENANT ID
  |--------------------------------------------------------------------------
  */

  const getTenantId = (tenant) => {
    const id =
      tenant?.id ??
      tenant?.tenant_id ??
      null;

    if (
      id === null ||
      id === undefined ||
      id === ""
    ) {
      return null;
    }

    return id;
  };

  /*
  |--------------------------------------------------------------------------
  | VIEW TENANT
  |--------------------------------------------------------------------------
  */

  const handleView = (tenant) => {
    setOpenMenu(null);

    const tenantId =
      getTenantId(tenant);

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

    const tenantId =
      getTenantId(tenant);

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
  | HTML ESCAPE
  |--------------------------------------------------------------------------
  |
  | Tenant names/numbers are API data.
  | Escape them before placing them inside SweetAlert html.
  |
  */

  const escapeHtml = (value) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE TENANT
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (
    tenant
  ) => {
    setOpenMenu(null);

    const tenantId =
      getTenantId(tenant);

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
      getTenantNumber(tenant);

    /*
     * Confirmation.
     */

    const confirmation =
      await Swal.fire({
        icon: "warning",
        title: "Delete Tenant?",
        html: `
          <div style="text-align:center">
            <p style="margin-bottom:8px;">
              Are you sure you want to delete
              <strong>${escapeHtml(
          tenantName
        )}</strong>?
            </p>

            <p style="font-size:13px;color:#6b7280;">
              Tenant Number:
              <strong>${escapeHtml(
          tenantNumber
        )}</strong>
            </p>

            <p style="font-size:13px;color:#dc2626;margin-top:12px;">
              This will remove the tenant
              from the active tenant list.
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

    if (!confirmation.isConfirmed) {
      return;
    }

    /*
     * Start deletion.
     */

    setDeletingId(tenantId);

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
       * Parent callback takes priority.
       */

      if (
        typeof onDelete ===
        "function"
      ) {
        result =
          await onDelete(tenant);
      } else {
        result =
          await removeTenant(
            tenantId
          );
      }

      console.log(
        "Tenant deletion response:",
        result
      );

      /*
       * Extract success message.
       */

      const successMessage =
        normalizeValue(
          result?.message
        ) ||
        normalizeValue(
          result?.data?.message
        ) ||
        (
          typeof result ===
            "string"
            ? result
            : ""
        ) ||
        "Tenant deleted successfully.";

      Swal.close();

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
       * Refresh after successful deletion.
       */

      if (
        typeof onRefresh ===
        "function"
      ) {
        await onRefresh();
      }
    } catch (error) {
      console.error(
        "Tenant deletion failed:",
        error
      );

      Swal.close();

      /*
       * Extract Laravel validation/API error.
       */

      const responseData =
        error?.response?.data;

      let message =
        normalizeValue(
          error?.message
        ) ||
        normalizeValue(
          error?.error
        ) ||
        normalizeValue(
          responseData?.message
        );

      /*
       * Laravel may return:
       *
       * errors: {
       *   tenant: [...]
       * }
       *
       * or:
       *
       * errors: {
       *   error: [...]
       * }
       */

      if (
        !message &&
        responseData?.errors
      ) {
        const errors =
          responseData.errors;

        const firstError =
          Object.values(errors)
            .flat()
            .find(Boolean);

        message =
          normalizeValue(
            firstError
          );
      }

      message =
        message ||
        normalizeValue(
          deleteError
        ) ||
        "Failed to delete tenant.";

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

    if (
      typeof onRefresh ===
      "function"
    ) {
      await onRefresh();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PAGE CHANGE
  |--------------------------------------------------------------------------
  */

  const handlePageChange = (
    page
  ) => {
    const nextPage =
      Number(page);

    if (
      !Number.isInteger(
        nextPage
      )
    ) {
      return;
    }

    if (
      nextPage < 1 ||
      nextPage > lastPage ||
      nextPage === currentPage
    ) {
      return;
    }

    setOpenMenu(null);

    if (
      typeof onPageChange ===
      "function"
    ) {
      onPageChange(nextPage);
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

      {/* ================================================================
          TABLE HEADER
      ================================================================= */}

      <div className="border-b border-gray-200 px-4 py-4 sm:px-6">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* TITLE */}

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Tenant List
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage registered tenants and
              their account information.
            </p>
          </div>

          {/* ACTIONS */}

          <div className="flex flex-col gap-2 sm:flex-row">

            {/* SEARCH */}

            <div className="relative">

              <Search
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search tenants..."
                aria-label="Search tenants"
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
                  onClick={() =>
                    setSearch("")
                  }
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
                  aria-label="Clear tenant search"
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
                className={`h-4 w-4 ${loading
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

      {/* ================================================================
          LOADING
      ================================================================= */}

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

      {/* ================================================================
          EMPTY STATE
      ================================================================= */}

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

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              className="
                mt-4
                text-sm
                font-medium
                text-primary-600
                hover:text-primary-700
                hover:underline
              "
            >
              Clear search
            </button>
          )}

        </div>
      )}

      {/* ================================================================
          TABLE
      ================================================================= */}

      {!loading &&
        filteredTenants.length > 0 && (
          <>

            <div className="overflow-x-auto">

              <table className="min-w-full divide-y divide-gray-200">

                {/* ======================================================
                    HEAD
                ======================================================= */}

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

                {/* ======================================================
                    BODY
                ======================================================= */}

                <tbody className="divide-y divide-gray-200 bg-white">

                  {filteredTenants.map(
                    (tenant, index) => {
                      const tenantId =
                        getTenantId(
                          tenant
                        );

                      const name =
                        getTenantName(
                          tenant
                        );

                      const email =
                        getTenantEmail(
                          tenant
                        );

                      const phone =
                        getTenantPhone(
                          tenant
                        );

                      const tenantNumber =
                        getTenantNumber(
                          tenant
                        );

                      const isDeleting =
                        deletingId ===
                        tenantId;

                      const verified =
                        isTenantVerified(
                          tenant
                        );

                      const rowKey =
                        tenantId ??
                        tenant?.tenant_number ??
                        `${name}-${index}`;

                      return (
                        <tr
                          key={rowKey}
                          className="
                            transition
                            hover:bg-gray-50
                          "
                        >

                          {/* ==================================================
                              TENANT
                          =================================================== */}

                          <td className="whitespace-nowrap px-4 py-4 sm:px-6">

                            <div className="flex items-center gap-3">

                              <div className="
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-primary-50
                                text-sm
                                font-semibold
                                text-primary-700
                              ">
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
                                    isDeleting ||
                                    !tenantId
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
                                  {email}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* ==================================================
                              TENANT NUMBER
                          =================================================== */}

                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                            {tenantNumber}
                          </td>

                          {/* ==================================================
                              PHONE
                          =================================================== */}

                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                            {phone}
                          </td>

                          {/* ==================================================
                              STATUS
                          =================================================== */}

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

                              {getStatusIcon(
                                tenant
                              )}

                              {formatStatus(
                                tenant
                              )}

                            </span>

                          </td>

                          {/* ==================================================
                              VERIFICATION
                          =================================================== */}

                          <td className="whitespace-nowrap px-4 py-4">

                            {verified ? (
                              <span className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-xs
                                font-medium
                                text-green-700
                              ">
                                <CheckCircle2 className="h-4 w-4" />

                                Verified
                              </span>
                            ) : (
                              <span className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-xs
                                font-medium
                                text-gray-500
                              ">
                                <XCircle className="h-4 w-4" />

                                Not Verified
                              </span>
                            )}

                          </td>

                          {/* ==================================================
                              ACTIONS
                          =================================================== */}

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
                                  deleting ||
                                  !tenantId
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
                                aria-label={`Actions for ${name}`}
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

                              {/* ==================================================
                                  MENU
                              =================================================== */}

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

            {/* ============================================================
                PAGINATION
            ============================================================= */}

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
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />

                      <span className="hidden sm:inline">
                        Previous
                      </span>
                    </button>

                    {/* CURRENT PAGE */}

                    <span
                      className="
                        inline-flex
                        h-9
                        items-center
                        rounded-lg
                        bg-primary-50
                        px-3
                        text-sm
                        font-medium
                        text-primary-700
                      "
                    >
                      {currentPage} / {lastPage}
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
                      aria-label="Next page"
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
