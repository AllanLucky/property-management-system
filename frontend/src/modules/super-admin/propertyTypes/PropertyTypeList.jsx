import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../../../api/axios";

import Swal from "sweetalert2";

import {
  Loader2,
  RefreshCcw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Building2,
  BadgeCheck,
  Star,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| REDUX NOTIFICATION
|--------------------------------------------------------------------------
*/
import { addNotification } from "../../../store/uiSlice";


const PropertyTypeList = () => {
  const dispatch = useDispatch();

  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");


  /*
  |--------------------------------------------------------------------------
  | FETCH PROPERTY TYPES
  |--------------------------------------------------------------------------
  */
  const getPropertyTypes = async (isRefresh = false) => {
    try {
      setError(null);

      isRefresh
        ? setRefreshing(true)
        : setLoading(true);


      const response = await api.get(
        `/property-types?_t=${Date.now()}`
      );


      let data = [];

      if (Array.isArray(response?.data?.data)) {
        data = response.data.data;
      } else if (Array.isArray(response?.data)) {
        data = response.data;
      }


      setTypes(data);


      /*
      |--------------------------------------------------------------------------
      | REFRESH SUCCESS NOTIFICATION
      |--------------------------------------------------------------------------
      */
      if (isRefresh) {
        dispatch(
          addNotification({
            type: "success",
            title: "Refreshed",
            message:
              "Property types loaded successfully.",
          })
        );
      }


    } catch (err) {

      const message =
        err?.response?.data?.message ||
        "Failed to load property types.";


      setError(message);


      dispatch(
        addNotification({
          type: "error",
          title: "Loading Failed",
          message,
        })
      );


    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    getPropertyTypes();
  }, []);



  /*
  |--------------------------------------------------------------------------
  | DELETE PROPERTY TYPE
  |--------------------------------------------------------------------------
  */
  const deleteType = async (id, name) => {

    const result = await Swal.fire({
      title: "Delete Property Type?",
      text: `You are about to delete "${name}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });


    if (!result.isConfirmed) {
      return;
    }


    try {

      setDeletingId(id);


      const response = await api.delete(
        `/property-types/${id}`
      );


      setTypes((prev) =>
        prev.filter((item) => item.id !== id)
      );


      const message =
        response?.data?.message ||
        `${name} deleted successfully.`;


      /*
      |--------------------------------------------------------------------------
      | REDUX SUCCESS NOTIFICATION
      |--------------------------------------------------------------------------
      */
      dispatch(
        addNotification({
          type: "success",
          title: "Deleted",
          message,
        })
      );


      /*
      |--------------------------------------------------------------------------
      | SWEET ALERT SUCCESS
      |--------------------------------------------------------------------------
      */
      Swal.fire({
        icon: "success",
        title: "Deleted Successfully",
        text: message,
        timer: 2000,
        showConfirmButton: false,
      });


    } catch (err) {


      const message =
        err?.response?.data?.message ||
        "Failed to delete property type.";


      setError(message);


      /*
      |--------------------------------------------------------------------------
      | REDUX ERROR NOTIFICATION
      |--------------------------------------------------------------------------
      */
      dispatch(
        addNotification({
          type: "error",
          title: "Delete Failed",
          message,
        })
      );


      /*
      |--------------------------------------------------------------------------
      | SWEET ALERT ERROR
      |--------------------------------------------------------------------------
      */
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
      });


    } finally {

      setDeletingId(null);

    }
  };
    /*
  |--------------------------------------------------------------------------
  | SEARCH FILTER
  |--------------------------------------------------------------------------
  */
  const filteredTypes = useMemo(() => {

    const query = search.toLowerCase().trim();

    if (!query) return types;

    return types.filter((type) =>
      type.name?.toLowerCase().includes(query) ||
      type.slug?.toLowerCase().includes(query)
    );

  }, [types, search]);


  /*
  |--------------------------------------------------------------------------
  | DASHBOARD STATS
  |--------------------------------------------------------------------------
  */
  const stats = useMemo(() => {

    return types.reduce((acc, item) => {

      acc.total += 1;

      if (item.status?.is_active) {
        acc.active += 1;
      }

      if (item.status?.is_featured) {
        acc.featured += 1;
      }

      return acc;

    }, {
      total: 0,
      active: 0,
      featured: 0,
    });

  }, [types]);


  /*
  |--------------------------------------------------------------------------
  | LOADING SCREEN
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">

        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />

        <p className="mt-3 text-gray-500">
          Loading property types...
        </p>

      </div>
    );
  }


  return (
    <div className="bg-white rounded-xl shadow border">


      {/* ERROR */}
      {
        error && (
          <div className="p-4 bg-red-50 border-b text-red-600">
            {error}
          </div>
        )
      }


      {/* HEADER */}
      <div className="p-4 flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold">
            Property Types
          </h1>

          <p className="text-gray-500 text-sm">
            Manage apartments, villas, offices,
            commercial spaces and more.
          </p>

        </div>


        <div className="flex gap-2">


          <button
            onClick={() => getPropertyTypes(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl"
          >

            {
              refreshing
                ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )
                : (
                  <RefreshCcw size={16}/>
                )
            }

            Refresh

          </button>


          <Link
            to="/super-admin/property-types/create"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white"
          >

            <Plus size={16}/>
            Add Type

          </Link>


        </div>

      </div>


      {/* STATISTICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-t">


        <StatCard
          title="Total Types"
          value={stats.total}
          icon={<Building2 />}
        />


        <StatCard
          title="Active"
          value={stats.active}
          icon={<BadgeCheck />}
          color="text-green-600"
        />


        <StatCard
          title="Featured"
          value={stats.featured}
          icon={<Star />}
          color="text-yellow-600"
        />


      </div>


      {/* SEARCH */}
      <div className="p-4 border-t">

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search property type..."
          className="w-full border rounded-xl px-4 py-2"
        />

      </div>


      {/* TABLE */}
      <div className="overflow-x-auto">


        <table className="w-full text-sm">


          <thead className="bg-gray-100">

            <tr>

              <th className="p-3 text-left">
                Property Type
              </th>

              <th>
                Properties
              </th>

              <th>
                Status
              </th>

              <th>
                Featured
              </th>

              <th>
                Slug
              </th>

              <th className="p-3 text-right">
                Actions
              </th>

            </tr>

          </thead>


          <tbody>


            {
              filteredTypes.length > 0

              ? filteredTypes.map((type) => (

                <tr
                  key={type.id}
                  className="border-t hover:bg-gray-50"
                >


                  <td className="p-3">

                    <div className="font-semibold">
                      {type.name}
                    </div>


                    <div className="text-xs text-gray-500">

                      {type.description}

                    </div>

                  </td>


                  <td className="text-center">

                    {
                      type.statistics?.total_properties ?? 0
                    }

                  </td>


                  <td className="text-center">


                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        type.status?.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >

                      {type.status?.label}

                    </span>


                  </td>


                  <td className="text-center">


                    {
                      type.status?.is_featured
                        ? "⭐ Featured"
                        : "Standard"
                    }


                  </td>


                  <td className="text-center text-gray-500">

                    {type.slug}

                  </td>


                  <td className="p-3">


                    <div className="flex justify-end gap-3">


                      <Link
                        to={`/super-admin/property-types/${type.id}`}
                        className="text-blue-600"
                      >

                        <Eye size={16}/>

                      </Link>



                      <Link
                        to={`/super-admin/property-types/edit/${type.id}`}
                        className="text-orange-600"
                      >

                        <Pencil size={16}/>

                      </Link>



                      <button
                        onClick={() =>
                          deleteType(type.id, type.name)
                        }
                        className="text-red-600"
                      >

                        {
                          deletingId === type.id

                          ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          )

                          : (
                            <Trash2 size={16}/>
                          )
                        }


                      </button>


                    </div>


                  </td>


                </tr>

              ))

              : (

                <tr>


                  <td
                    colSpan="6"
                    className="py-10 text-center text-gray-500"
                  >

                    No property types found

                  </td>


                </tr>

              )
            }


          </tbody>


        </table>


      </div>


    </div>
  );

};


/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/
const StatCard = ({
  title,
  value,
  icon,
  color = "text-gray-900",
}) => {

  return (

    <div className="border rounded-xl p-4 shadow-sm flex justify-between items-center">


      <div>

        <p className="text-sm text-gray-500">

          {title}

        </p>


        <h2 className={`text-xl font-bold ${color}`}>

          {value}

        </h2>


      </div>


      <div className="text-gray-400">

        {icon}

      </div>


    </div>

  );

};


export default PropertyTypeList;
