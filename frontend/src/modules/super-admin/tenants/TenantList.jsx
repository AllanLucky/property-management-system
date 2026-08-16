import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  AlertCircle,
} from "lucide-react";

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
| Main tenant management page.
|
| Responsibilities:
| - Fetch tenants
| - Manage tenant filters
| - Manage pagination
| - Display tenant statistics
| - Display tenant table
| - Create tenant
| - Edit tenant
| - Refresh tenant data
| - Handle API errors
| - Work with tenant + tenancy API response
|--------------------------------------------------------------------------
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
  | INITIAL FETCH CONTROL
  |--------------------------------------------------------------------------
  |
  | Prevents the initial useEffect from causing unnecessary duplicate
  | requests when Redux filters are initialized.
  |
  */

  const hasInitialFetched = useRef(false);


  /*
  |--------------------------------------------------------------------------
  | SAFE TENANT DATA
  |--------------------------------------------------------------------------
  */

  const tenantList = Array.isArray(tenants)
    ? tenants
    : [];


  /*
  |--------------------------------------------------------------------------
  | SAFE FILTERS
  |--------------------------------------------------------------------------
  */

  const tenantFilters = filters || {};


  /*
  |--------------------------------------------------------------------------
  | SAFE PAGINATION
  |--------------------------------------------------------------------------
  */

  const tenantPagination = pagination || {};


  /*
  |--------------------------------------------------------------------------
  | FETCH TENANTS
  |--------------------------------------------------------------------------
  */

  const loadTenants = useCallback(
    async (customFilters = {}) => {
      const requestFilters = {
        ...tenantFilters,
        ...customFilters,
      };

      /*
      |--------------------------------------------------------------------------
      | Remove undefined/null values
      |--------------------------------------------------------------------------
      */

      const cleanedFilters = Object.entries(
        requestFilters
      ).reduce((acc, [key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          acc[key] = value;
        }

        return acc;
      }, {});


      try {
        return await dispatch(
          fetchTenants(cleanedFilters)
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
      dispatch,
      tenantFilters,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | INITIAL FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (hasInitialFetched.current) {
      return;
    }

    hasInitialFetched.current = true;

    loadTenants().catch(() => {});
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
          search: String(value),
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
  */

  const handleStatusChange = useCallback(
    (status = "") => {
      dispatch(
        setTenantFilters({
          status,
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

      const lastPage = Number(
        tenantPagination?.last_page || 1
      );

      if (
        lastPage > 0 &&
        nextPage > lastPage
      ) {
        return;
      }

      dispatch(
        setTenantFilters({
          page: nextPage,
        })
      );
    },
    [
      dispatch,
      tenantPagination,
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
    setShowCreate(true);
  }, []);


  /*
  |--------------------------------------------------------------------------
  | EDIT TENANT
  |--------------------------------------------------------------------------
  |
  | The tenant object contains:
  |
  | tenant details
  | + tenancies[]
  | + tenancy_count
  |
  | Therefore the complete API object is passed to EditTenant.
  |
  */

  const handleEdit = useCallback((tenant) => {
    if (!tenant || !tenant.id) {
      return;
    }

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
    async (createdTenant = null) => {
      setShowCreate(false);
      setSelectedTenant(null);

      /*
      |----------------------------------------------------------------------
      | Refresh the current tenant list
      |----------------------------------------------------------------------
      */

      await loadTenants().catch(() => {});
    },
    [loadTenants]
  );


  /*
  |--------------------------------------------------------------------------
  | AFTER UPDATE
  |--------------------------------------------------------------------------
  */

  const handleUpdated = useCallback(
    async (updatedTenant = null) => {
      setShowEdit(false);
      setSelectedTenant(null);

      /*
      |----------------------------------------------------------------------
      | Refresh the current tenant list
      |----------------------------------------------------------------------
      */

      await loadTenants().catch(() => {});
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
  | Matches the filters supported by the tenant API.
  |
  */

  const handleClearFilters = useCallback(() => {
    dispatch(
      setTenantFilters({
        search: "",
        status: "",
        is_active: undefined,
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

  const hasTenants =
    tenantList.length > 0;


  /*
  |--------------------------------------------------------------------------
  | PAGINATION STATE
  |--------------------------------------------------------------------------
  */

  const currentPage = Number(
    tenantPagination?.current_page || 1
  );

  const lastPage = Number(
    tenantPagination?.last_page || 1
  );

  const totalTenants = Number(
    tenantPagination?.total ||
      tenantList.length ||
      0
  );

  const hasPagination =
    lastPage > 1;


  /*
  |--------------------------------------------------------------------------
  | INITIAL LOADING
  |--------------------------------------------------------------------------
  */

  const showSkeleton =
    loading && !hasTenants;


  /*
  |--------------------------------------------------------------------------
  | EMPTY SEARCH/FILTER STATE
  |--------------------------------------------------------------------------
  */

  const hasActiveFilters =
    Boolean(
      tenantFilters?.search ||
      tenantFilters?.status ||
      tenantFilters?.gender ||
      tenantFilters?.country ||
      tenantFilters?.county ||
      tenantFilters?.city ||
      tenantFilters?.is_active !== undefined ||
      tenantFilters?.is_verified !== undefined
    );


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
              {typeof error === "string"
                ? error
                : error?.message ||
                  error?.error ||
                  "An unexpected error occurred while loading tenants."}
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
                className="
                  text-sm
                  text-gray-500
                "
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
          search={
            tenantFilters?.search || ""
          }
          status={
            tenantFilters?.status || ""
          }
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