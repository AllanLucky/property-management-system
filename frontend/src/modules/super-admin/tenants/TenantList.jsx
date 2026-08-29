import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useDispatch, useSelector } from "react-redux";

import { AlertCircle } from "lucide-react";

import {
  fetchTenants,
  setTenantFilters,
  clearTenantError,
  selectTenants,
  selectTenantPagination,
  selectTenantFilters,
  selectTenantLoading,
  selectTenantError,
} from "../../../store/tenantSlice";

import TenantHeader from "./TenantHeader";
import TenantStats from "./TenantStats";
import TenantFilters from "./TenantFilters";
import TenantTable from "./TenantTable";
import TenantPagination from "./TenantPagination";
import TenantSkeleton from "./TenantSkeleton";
import TenantEmptyState from "./TenantEmptyState";
import CreateTenant from "./CreateTenant";
import EditTenant from "./EditTenant";

/*
|--------------------------------------------------------------------------
| TenantList
|--------------------------------------------------------------------------
|
| Main tenant management page.
|
| Responsibilities:
| - Load tenants
| - Manage tenant filters
| - Manage pagination
| - Display tenant statistics
| - Display tenant table
| - Create tenant
| - Edit tenant
| - Refresh tenant data
| - Handle API errors
|
*/

const TenantList = () => {
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | REDUX STATE
  |--------------------------------------------------------------------------
  */

  const tenants = useSelector(selectTenants);
  const pagination = useSelector(selectTenantPagination);
  const filters = useSelector(selectTenantFilters);
  const loading = useSelector(selectTenantLoading);
  const error = useSelector(selectTenantError);

  /*
  |--------------------------------------------------------------------------
  | LOCAL UI STATE
  |--------------------------------------------------------------------------
  */

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | SAFE / NORMALIZED DATA
  |--------------------------------------------------------------------------
  */

  const tenantList = useMemo(
    () => (Array.isArray(tenants) ? tenants : []),
    [tenants]
  );

  const tenantFilters = useMemo(
    () => filters || {},
    [filters]
  );

  const tenantPagination = useMemo(
    () => pagination || {},
    [pagination]
  );

  /*
  |--------------------------------------------------------------------------
  | PAGINATION VALUES
  |--------------------------------------------------------------------------
  */

  const currentPage = Math.max(
    1,
    Number(tenantPagination.current_page || 1)
  );

  const lastPage = Math.max(
    1,
    Number(tenantPagination.last_page || 1)
  );

  const totalTenants = Math.max(
    0,
    Number(
      tenantPagination.total ??
        tenantList.length ??
        0
    )
  );

  const hasPagination = lastPage > 1;

  /*
  |--------------------------------------------------------------------------
  | FILTER STATE
  |--------------------------------------------------------------------------
  */

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      tenantFilters.search ||
        tenantFilters.status ||
        tenantFilters.gender ||
        tenantFilters.country ||
        tenantFilters.county ||
        tenantFilters.city ||
        tenantFilters.is_verified !== undefined
    );
  }, [tenantFilters]);

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  const showSkeleton =
    loading && tenantList.length === 0;

  /*
  |--------------------------------------------------------------------------
  | CLEAN FILTERS
  |--------------------------------------------------------------------------
  |
  | Removes empty/null/undefined values before sending
  | the request to the Laravel API.
  |
  */

  const cleanFilters = useCallback((source = {}) => {
    return Object.entries(source).reduce(
      (result, [key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          result[key] = value;
        }

        return result;
      },
      {}
    );
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH TENANTS
  |--------------------------------------------------------------------------
  */

  const loadTenants = useCallback(
    async (customFilters = {}) => {
      const requestFilters = cleanFilters({
        ...tenantFilters,
        ...customFilters,
      });

      try {
        return await dispatch(
          fetchTenants(requestFilters)
        ).unwrap();
      } catch (fetchError) {
        console.error(
          "Failed to fetch tenants:",
          fetchError
        );

        throw fetchError;
      }
    },
    [
      cleanFilters,
      dispatch,
      tenantFilters,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL / FILTERED LOAD
  |--------------------------------------------------------------------------
  |
  | The Redux filter state is the source of truth.
  |
  */

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        if (!cancelled) {
          await loadTenants();
        }
      } catch {
        // Redux already stores the error.
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [loadTenants]);

  /*
  |--------------------------------------------------------------------------
  | FILTER CHANGE
  |--------------------------------------------------------------------------
  */

  const handleFiltersChange = useCallback(
    (newFilters = {}) => {
      dispatch(
        setTenantFilters({
          ...newFilters,
          page: 1,
        })
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const handleSearch = useCallback(
    (value = "") => {
      dispatch(
        setTenantFilters({
          search: String(value ?? ""),
          page: 1,
        })
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | STATUS FILTER
  |--------------------------------------------------------------------------
  |
  | Supported statuses:
  |
  | - active
  | - pending
  | - inactive
  | - blacklisted
  |
  */

  const handleStatusChange = useCallback(
    (status = "") => {
      dispatch(
        setTenantFilters({
          status: String(status ?? ""),
          page: 1,
        })
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | PAGE CHANGE
  |--------------------------------------------------------------------------
  */

  const handlePageChange = useCallback(
    (page) => {
      const nextPage = Number(page);

      if (
        !Number.isInteger(nextPage) ||
        nextPage < 1
      ) {
        return;
      }

      if (
        lastPage > 0 &&
        nextPage > lastPage
      ) {
        return;
      }

      if (nextPage === currentPage) {
        return;
      }

      dispatch(
        setTenantFilters({
          page: nextPage,
        })
      );
    },
    [
      currentPage,
      dispatch,
      lastPage,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | PER PAGE CHANGE
  |--------------------------------------------------------------------------
  */

  const handlePerPageChange = useCallback(
    (perPage) => {
      const nextPerPage = Number(perPage);

      if (
        !Number.isInteger(nextPerPage) ||
        nextPerPage < 1
      ) {
        return;
      }

      dispatch(
        setTenantFilters({
          per_page: nextPerPage,
          page: 1,
        })
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = useCallback(() => {
    return loadTenants().catch(() => {});
  }, [loadTenants]);

  /*
  |--------------------------------------------------------------------------
  | CREATE TENANT
  |--------------------------------------------------------------------------
  */

  const handleCreate = useCallback(() => {
    setSelectedTenant(null);
    setShowEdit(false);
    setShowCreate(true);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | EDIT TENANT
  |--------------------------------------------------------------------------
  */

  const handleEdit = useCallback((tenant) => {
    if (!tenant) {
      return;
    }

    const tenantId = Number(tenant.id);

    if (
      !Number.isInteger(tenantId) ||
      tenantId < 1
    ) {
      console.warn(
        "Cannot edit tenant: invalid tenant ID.",
        tenant
      );

      return;
    }

    setShowCreate(false);
    setSelectedTenant(tenant);
    setShowEdit(true);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLOSE CREATE
  |--------------------------------------------------------------------------
  */

  const handleCloseCreate = useCallback(() => {
    setShowCreate(false);
    setSelectedTenant(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLOSE EDIT
  |--------------------------------------------------------------------------
  */

  const handleCloseEdit = useCallback(() => {
    setShowEdit(false);
    setSelectedTenant(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | AFTER CREATE
  |--------------------------------------------------------------------------
  */

  const handleCreated = useCallback(
    async () => {
      setShowCreate(false);
      setSelectedTenant(null);

      try {
        await loadTenants();
      } catch {
        // Redux already contains the error.
      }
    },
    [loadTenants]
  );

  /*
  |--------------------------------------------------------------------------
  | AFTER UPDATE
  |--------------------------------------------------------------------------
  */

  const handleUpdated = useCallback(
    async () => {
      setShowEdit(false);
      setSelectedTenant(null);

      try {
        await loadTenants();
      } catch {
        // Redux already contains the error.
      }
    },
    [loadTenants]
  );

  /*
  |--------------------------------------------------------------------------
  | CLEAR ERROR
  |--------------------------------------------------------------------------
  */

  const handleClearError = useCallback(() => {
    dispatch(clearTenantError());
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR FILTERS
  |--------------------------------------------------------------------------
  |
  | Do not send is_active because the tenants table/API
  | uses status instead.
  |
  */

  const handleClearFilters = useCallback(() => {
    dispatch(
      setTenantFilters({
        search: "",
        status: "",
        is_verified: undefined,
        gender: "",
        country: "",
        county: "",
        city: "",
        page: 1,
      })
    );
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | TENANT LIST STATE
  |--------------------------------------------------------------------------
  */

  const hasTenants = tenantList.length > 0;

  /*
  |--------------------------------------------------------------------------
  | ERROR MESSAGE
  |--------------------------------------------------------------------------
  */

  const errorMessage = useMemo(() => {
    if (!error) {
      return "";
    }

    if (typeof error === "string") {
      return error;
    }

    return (
      error?.message ||
      error?.error ||
      error?.errors?.message ||
      "An unexpected error occurred while loading tenants."
    );
  }, [error]);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* ================================================================
          PAGE HEADER
      ================================================================= */}

      <TenantHeader
        onCreate={handleCreate}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* ================================================================
          ERROR MESSAGE
      ================================================================= */}

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-red-200
            bg-red-50
            p-4
            text-red-700
          "
        >
          <AlertCircle
            className="
              mt-0.5
              h-5
              w-5
              shrink-0
            "
            aria-hidden="true"
          />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Unable to load tenants
            </p>

            <p className="mt-1 text-sm">
              {errorMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearError}
            className="
              shrink-0
              text-sm
              font-medium
              hover:underline
            "
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ================================================================
          TENANT STATISTICS
      ================================================================= */}

      <TenantStats />

      {/* ================================================================
          TENANT FILTERS
      ================================================================= */}

      <TenantFilters
        filters={tenantFilters}
        onChange={handleFiltersChange}
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* ================================================================
          TENANT CONTENT
      ================================================================= */}

      {showSkeleton ? (
        /*
        |--------------------------------------------------------------------------
        | LOADING
        |--------------------------------------------------------------------------
        */

        <TenantSkeleton />
      ) : hasTenants ? (
        /*
        |--------------------------------------------------------------------------
        | TENANT LIST
        |--------------------------------------------------------------------------
        */

        <>
          {/* ============================================================
              LIST SUMMARY
          ============================================================= */}

          <div
            className="
              flex
              flex-col
              gap-2
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <p className="text-sm text-gray-500">
                {hasActiveFilters
                  ? "Filtered tenants"
                  : "All tenants"}
              </p>

              <p className="text-sm font-medium text-gray-900">
                {totalTenants.toLocaleString()} tenant
                {totalTenants === 1 ? "" : "s"}
              </p>
            </div>

            {loading && (
              <p
                className="text-sm text-gray-500"
                aria-live="polite"
              >
                Updating tenant data...
              </p>
            )}
          </div>

          {/* ============================================================
              TENANT TABLE
          ============================================================= */}

          <TenantTable
            tenants={tenantList}
            loading={loading}
            onEdit={handleEdit}
            onRefresh={handleRefresh}
          />

          {/* ============================================================
              PAGINATION
          ============================================================= */}

          {hasPagination && (
            <TenantPagination
              pagination={{
                ...tenantPagination,
                current_page: currentPage,
                last_page: lastPage,
                total: totalTenants,
              }}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
            />
          )}
        </>
      ) : (
        /*
        |--------------------------------------------------------------------------
        | EMPTY STATE
        |--------------------------------------------------------------------------
        */

        <TenantEmptyState
          search={tenantFilters.search || ""}
          status={tenantFilters.status || ""}
          onCreate={handleCreate}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* ================================================================
          CREATE TENANT MODAL
      ================================================================= */}

      {showCreate && (
        <CreateTenant
          open={showCreate}
          onClose={handleCloseCreate}
          onCreated={handleCreated}
        />
      )}

      {/* ================================================================
          EDIT TENANT MODAL
      ================================================================= */}

      {showEdit && selectedTenant && (
        <EditTenant
          open={showEdit}
          tenant={selectedTenant}
          onClose={handleCloseEdit}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
};

export default TenantList;