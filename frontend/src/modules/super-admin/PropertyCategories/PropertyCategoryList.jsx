import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/axios";
import Swal from "sweetalert2";
import {
  Loader2,
  RefreshCcw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  FolderTree,
  BadgeCheck,
  Star,
  AlertTriangle,
} from "lucide-react";

const PropertyCategoryList = () => {

  /*
  |--------------------------------------------------------------------------
  | STATES
  |--------------------------------------------------------------------------
  */
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");


  /*
  |--------------------------------------------------------------------------
  | FETCH CATEGORIES
  |--------------------------------------------------------------------------
  */
  const getCategories = async (isRefresh = false) => {

    try {

      setError(null);

      isRefresh
        ? setRefreshing(true)
        : setLoading(true);


      const response = await api.get(
        `/property-categories?_t=${Date.now()}`
      );


      /*
      |--------------------------------------------------------------------------
      | SAFE API RESPONSE EXTRACTION
      |--------------------------------------------------------------------------
      */
      let data = [];

      if (Array.isArray(response?.data?.data)) {

        data = response.data.data;

      } else if (
        Array.isArray(response?.data?.categories)
      ) {

        data = response.data.categories;

      } else if (
        Array.isArray(response?.data)
      ) {

        data = response.data;

      }


      setCategories(data);

    } catch (err) {

      console.error(
        "Failed loading categories:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch property categories."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  };


  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */
  useEffect(() => {

    getCategories();

  }, []);



  /*
  |--------------------------------------------------------------------------
  | DELETE CATEGORY
  |--------------------------------------------------------------------------
  */
  const deleteCategory = async (
    id,
    categoryName = "this category"
  ) => {
    const result = await Swal.fire({
      title: "Delete Property Category?",
      html: `
      <div style="font-size:14px;color:#6b7280">
        You are about to permanently delete
        <strong>${categoryName}</strong>.
        <br /><br />
        This action cannot be undone.
      </div>
    `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      background: "#ffffff",
      customClass: {
        popup: "rounded-3xl",
        confirmButton: "rounded-xl px-5 py-2",
        cancelButton: "rounded-xl px-5 py-2",
      },
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(id);

      await api.delete(`/property-categories/${id}`);

      setCategories((prev) =>
        prev.filter(
          (category) => category.id !== id
        )
      );

      await Swal.fire({
        icon: "success",
        title: "Deleted Successfully",
        text: `${categoryName} has been deleted successfully.`,
        confirmButtonColor: "#16a34a",
        confirmButtonText: "OK",
        background: "#ffffff",
        customClass: {
          popup: "rounded-3xl",
          confirmButton: "rounded-xl px-5 py-2",
        },
      });

    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text:
          err?.response?.data?.message ||
          err?.message ||
          "Unable to delete category.",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "OK",
        background: "#ffffff",
        customClass: {
          popup: "rounded-3xl",
          confirmButton: "rounded-xl px-5 py-2",
        },
      });
    } finally {
      setDeletingId(null);
    }
  };



  /*
  |--------------------------------------------------------------------------
  | HELPER FUNCTIONS
  |--------------------------------------------------------------------------
  */


  /*
  | CATEGORY IMAGE
  */
  const getImage = (category) => {

    return (
      category?.media?.image_url ||
      category?.image_url ||
      "https://placehold.co/100x100?text=Category"
    );

  };


  /*
  | FEATURED STATUS (FIXED)
  | Supports:
  | flags.is_featured
  | is_featured
  | true, 1, "1", "true"
  */
  const isFeatured = (category) => {

    const value =
      category?.flags?.is_featured ??
      category?.is_featured;


    return (
      value === true ||
      value === 1 ||
      value === "1" ||
      value === "true"
    );

  };



  /*
  | ACTIVE STATUS (FIXED)
  | Supports:
  | flags.is_active
  | status = active
  | true
  */
  const isActive = (category) => {


    const value =
      category?.flags?.is_active ??
      category?.status;


    return (
      value === true ||
      value === "active" ||
      value === 1 ||
      value === "1"
    );

  };



  /*
  | PROPERTY COUNT
  */
  const propertyCount = (category) => {

    return (
      category?.stats?.properties_count ??
      category?.properties_count ??
      0
    );

  };



  /*
  |--------------------------------------------------------------------------
  | SEARCH FILTER
  |--------------------------------------------------------------------------
  */
  const filteredCategories = useMemo(() => {


    const keyword =
      search.toLowerCase().trim();


    if (!keyword) {
      return categories;
    }


    return categories.filter((category) => {


      return (
        category?.name
          ?.toLowerCase()
          .includes(keyword) ||

        category?.slug
          ?.toLowerCase()
          .includes(keyword) ||

        category?.description
          ?.toLowerCase()
          .includes(keyword)
      );


    });


  }, [
    categories,
    search
  ]);




  /*
  |--------------------------------------------------------------------------
  | DASHBOARD STATS
  |--------------------------------------------------------------------------
  */
  const dashboard = useMemo(() => {


    return categories.reduce(
      (result, category) => {


        result.total += 1;


        if (isActive(category)) {

          result.active += 1;

        }


        if (isFeatured(category)) {

          result.featured += 1;

        }


        return result;


      },
      {
        total: 0,
        active: 0,
        featured: 0,
      }
    );


  }, [categories]);
  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />

        <p className="mt-3 text-gray-500">
          Loading property categories...
        </p>
      </div>
    );
  }


  return (
    <div className="bg-white rounded-2xl shadow border">


      {/* ERROR MESSAGE */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-red-600 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}


      {/* HEADER */}
      <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">


        <div>
          <h1 className="text-2xl font-bold">
            Property Categories
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage property categories and classifications.
          </p>
        </div>


        <div className="flex items-center gap-3">


          {/* Refresh */}
          <button
            type="button"
            onClick={() => getCategories(true)}
            className="
              inline-flex items-center gap-2
              px-4 py-2 rounded-xl
              border border-gray-300
              hover:bg-gray-50 transition
            "
          >
            {refreshing ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <RefreshCcw size={16} />
            )}

            Refresh
          </button>


          {/* Add Category */}
          <Link
            to="/super-admin/property-categories/create"
            className="
              inline-flex items-center gap-2
              px-4 py-2 rounded-xl
              bg-blue-600 text-white
              hover:bg-blue-700 transition
            "
          >
            <Plus size={16} />

            Add Category
          </Link>

        </div>

      </div>


      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border-t">


        <StatCard
          title="Total Categories"
          value={dashboard.total}
          icon={<FolderTree />}
        />


        <StatCard
          title="Active Categories"
          value={dashboard.active}
          icon={<BadgeCheck />}
          color="text-green-600"
        />


        <StatCard
          title="Featured Categories"
          value={dashboard.featured}
          icon={<Star />}
          color="text-yellow-500"
        />


      </div>


      {/* SEARCH */}
      <div className="p-5 border-t">

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search by name, slug or description..."
          className="
            w-full
            rounded-xl
            border border-gray-300
            px-4 py-3
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
          "
        />

      </div>


      {/* TABLE */}
      <div className="overflow-x-auto">

        <table className="w-full text-sm">


          {/* TABLE HEADER */}
          <thead className="bg-gray-100">

            <tr>

              <th className="text-left p-4">
                Category
              </th>

              <th className="text-center p-4">
                Properties
              </th>

              <th className="text-center p-4">
                Status
              </th>

              <th className="text-center p-4">
                Featured
              </th>

              <th className="text-right p-4">
                Actions
              </th>

            </tr>

          </thead>


          {/* TABLE BODY */}
          <tbody>

            {filteredCategories.length > 0 ? (

              filteredCategories.map((category) => (

                <tr
                  key={category.id}
                  className="border-t hover:bg-gray-50 transition"
                >


                  {/* CATEGORY INFO */}
                  <td className="p-4">

                    <div className="flex items-center gap-3">


                      <img
                        src={getImage(category)}
                        alt={category.name}
                        className="
                          w-12 h-12
                          rounded-xl
                          object-cover
                          border
                        "
                      />


                      <div>

                        <h3 className="font-semibold text-gray-900">
                          {category.name}
                        </h3>


                        <p className="text-xs text-gray-500">
                          {category.slug}
                        </p>


                        {category.description && (

                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {category.description}
                          </p>

                        )}

                      </div>


                    </div>

                  </td>


                  {/* PROPERTIES COUNT */}
                  <td className="text-center">
                    {propertyCount(category)}
                  </td>


                  {/* STATUS */}
                  <td className="text-center">

                    <span
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${isActive(category)
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                        }
                      `}
                    >
                      {isActive(category)
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </td>


                  {/* FEATURED */}
                  <td className="text-center">

                    {isFeatured(category) ? (
                      <span className="text-yellow-500 font-semibold">
                        ⭐ Featured
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        No
                      </span>
                    )}

                  </td>
                  {/* ACTIONS */}
                  <td className="text-right p-4">

                    <div className="flex items-center justify-end gap-3">


                      {/* VIEW */}
                      <Link
                        to={`/super-admin/property-categories/${category.id}`}
                        className="
                          text-blue-600
                          hover:text-blue-800
                          transition
                        "
                        title="View Category"
                      >
                        <Eye size={18} />
                      </Link>


                      {/* EDIT */}
                      <Link
                        to={`/super-admin/property-categories/edit/${category.id}`}
                        className="
                          text-orange-500
                          hover:text-orange-700
                          transition
                        "
                        title="Edit Category"
                      >
                        <Pencil size={18} />
                      </Link>


                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          deleteCategory(
                            category.id,
                            category.name
                          )
                        }
                        disabled={deletingId === category.id}
                        className="
                          inline-flex items-center justify-center
                           w-9 h-9
                           rounded
                          bg-red-50
                          text-red-600
                          hover:bg-red-100
                          hover:text-red-700
                           transition-all
                           duration-200
                           disabled:opacity-50
                           "
                        title={`Delete ${category.name}`}
                      >
                        {deletingId === category.id ? (
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>

                  </td>


                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan="5"
                  className="
                    py-14
                    text-center
                    text-gray-500
                  "
                >

                  <div className="flex flex-col items-center gap-3">

                    <FolderTree
                      className="w-10 h-10 text-gray-300"
                    />

                    <p>
                      No property categories found.
                    </p>

                  </div>

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};


/*
|--------------------------------------------------------------------------
| STAT CARD COMPONENT
|--------------------------------------------------------------------------
*/

const StatCard = ({
  title,
  value,
  icon,
  color = "text-gray-900",
}) => {

  return (

    <div
      className="
        bg-white
        border
        rounded-xl
        p-4
        shadow-sm
        flex
        items-center
        justify-between
      "
    >

      <div>

        <p className="text-sm text-gray-500">
          {title}
        </p>

        <h2
          className={`
            text-2xl
            font-bold
            mt-1
            ${color}
          `}
        >
          {value}
        </h2>

      </div>


      <div className="text-gray-400">

        {icon}

      </div>
    </div>
  );

};


export default PropertyCategoryList;