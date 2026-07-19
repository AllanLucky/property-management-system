import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";

import {
  Plus,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import api from "../../../api/axios";

import {
  fetchPropertyVisits,
} from "../../../store/propertyVisitSlice";


const PropertyVisitCreate = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();


  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [properties, setProperties] = useState([]);

  const [loadingProperties, setLoadingProperties] = useState(true);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);


  const [form, setForm] = useState({

    property_id: "",

    user_id: "",

    duration: 0,

    page_views: 1,

    scroll_percentage: 0,

    country: "",
    region: "",
    county: "",
    city: "",

    browser: "",
    browser_version: "",
    operating_system: "",

    device: "desktop",

    source: "direct",
    medium: "",
    campaign: "",

    scheduled_visit: false,
    bookmarked: false,
    shared: false,

    contact_clicked: false,
    call_clicked: false,
    whatsapp_clicked: false,
    email_clicked: false,

  });



  /*
  |--------------------------------------------------------------------------
  | FETCH PROPERTIES
  |--------------------------------------------------------------------------
  */

  const fetchProperties = useCallback(async () => {

    try {

      setLoadingProperties(true);


      const res = await api.get(
        "/properties"
      );


      setProperties(
        res?.data?.data ?? []
      );


    } catch (err) {

      setError(
        err?.response?.data?.message ||
        "Failed loading properties"
      );


    } finally {

      setLoadingProperties(false);

    }


  }, []);



  useEffect(() => {

    fetchProperties();

  }, [fetchProperties]);





  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */


  const handleChange = (e) => {

    const {
      name,
      value,
      type,
      checked
    } = e.target;


    setForm(prev => ({

      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value

    }));

  };





  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */


  const handleSubmit = async (e) => {

    e.preventDefault();


    try {


      setLoading(true);


      setError(null);



      await api.post(
        "/property-visits",
        {
          ...form,

          property_id: Number(form.property_id),

          duration: Number(form.duration),

          page_views: Number(form.page_views),

          scroll_percentage: Number(
            form.scroll_percentage
          )

        }
      );



      await Swal.fire({

        icon: "success",

        title: "Created",

        text: "Property visit created successfully",

        timer: 1500,

        showConfirmButton: false

      });



      dispatch(fetchPropertyVisits());


      navigate(
        "/super-admin/property-visits"
      );



    } catch (err) {


      const message =
        err?.response?.data?.message ||
        "Creation failed";


      setError(message);


      Swal.fire({

        icon: "error",

        title: "Failed",

        text: message

      });



    } finally {

      setLoading(false);

    }

  };





  if (loadingProperties) {

    return (

      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 mt-3">
          Loading property-visits...
        </p>
      </div>

    );

  }





  return (

    <div className="rounded-2xl bg-white p-6 shadow">


      {/* HEADER */}

      <div className="flex justify-between items-center">


        <div>

          <h1 className="text-3xl font-bold">
            Create Property Visit
          </h1>


          <p className="text-gray-500">
            Create visitor analytics record
          </p>

        </div>



        <Link

          to="/super-admin/property-visits"

          className="flex items-center gap-2 border px-4 py-2 rounded-xl"

        >

          <ArrowLeft size={18} />

          Back

        </Link>


      </div>





      {
        error &&

        <div className="mt-4 rounded-lg bg-red-50 p-3 text-red-600">

          {error}

        </div>

      }






      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2"
      >



        {/* PROPERTY */}

        <div>

          <label>
            Property
          </label>


          <select

            name="property_id"

            value={form.property_id}

            onChange={handleChange}

            className="w-full border rounded-lg p-2"

            required

          >

            <option value="">
              Select Property
            </option>


            {
              properties.map(property => (

                <option
                  key={property.id}
                  value={property.id}
                >

                  {
                    property.title ||
                    property.name
                  }

                </option>

              ))
            }


          </select>


        </div>





        {/* COUNTRY */}

        <div>

          <label>
            Country
          </label>


          <input

            name="country"

            value={form.country}

            onChange={handleChange}

            className="w-full border rounded-lg p-2"

          />


        </div>





        {/* CITY */}

        <div>

          <label>
            City
          </label>


          <input

            name="city"

            value={form.city}

            onChange={handleChange}

            className="w-full border rounded-lg p-2"

          />

        </div>





        {/* DEVICE */}

        <div>

          <label>
            Device
          </label>


          <select

            name="device"

            value={form.device}

            onChange={handleChange}

            className="w-full border rounded-lg p-2"

          >

            <option value="mobile">
              Mobile
            </option>

            <option value="desktop">
              Desktop
            </option>

            <option value="tablet">
              Tablet
            </option>


          </select>

        </div>





        {/* BROWSER */}

        <div>

          <label>
            Browser
          </label>


          <input

            name="browser"

            value={form.browser}

            onChange={handleChange}

            className="w-full border rounded-lg p-2"

          />

        </div>





        {/* SOURCE */}

        <div>

          <label>
            Traffic Source
          </label>


          <input

            name="source"

            value={form.source}

            onChange={handleChange}

            className="w-full border rounded-lg p-2"

          />


        </div>





        {/* DURATION */}

        <div>

          <label>
            Duration Seconds
          </label>


          <input

            type="number"

            name="duration"

            value={form.duration}

            onChange={handleChange}

            className="w-full border rounded-lg p-2"

          />


        </div>





        {/* PAGE VIEWS */}

        <div>

          <label>
            Page Views
          </label>


          <input

            type="number"

            name="page_views"

            value={form.page_views}

            onChange={handleChange}

            className="w-full border rounded-lg p-2"

          />


        </div>






        {/* ACTION CHECKBOXES */}

        <div className="md:col-span-2 flex flex-wrap gap-6">


          {
            [
              "scheduled_visit",
              "bookmarked",
              "shared",
              "contact_clicked",
              "call_clicked",
              "whatsapp_clicked",
              "email_clicked"

            ].map(item => (


              <label
                key={item}
                className="flex items-center gap-2"
              >

                <input

                  type="checkbox"

                  name={item}

                  checked={form[item]}

                  onChange={handleChange}

                />


                {item.replaceAll("_", " ")}


              </label>


            ))

          }


        </div>







        <div className="md:col-span-2 flex justify-end gap-3">


          <button

            type="button"

            onClick={() => navigate(-1)}

            className="border px-5 py-2 rounded-lg"

          >

            Cancel

          </button>




          <button

            disabled={loading}

            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg"

          >


            {
              loading ?

                <Loader2 className="animate-spin" />

                :

                <Plus size={18} />

            }


            Create Visit


          </button>


        </div>




      </form>


    </div>

  );


};


export default PropertyVisitCreate;