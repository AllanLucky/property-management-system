import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  ArrowLeft,
  Heart,
  Loader2,
  Save,
  AlertTriangle,
} from "lucide-react";

import {
  fetchPropertyFavorite,
  updatePropertyFavorite,
  selectFavoriteSubmitting,
  selectFavoriteError,
  clearErrors,
} from "../../../store/propertyFavoriteSlice";

import { addNotification } from "../../../store/uiSlice";

import api from "../../../api/axios";


const EditPropertyFavorite = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { id } = useParams();


  /*
  |--------------------------------------------------------------------------
  | REDUX
  |--------------------------------------------------------------------------
  */

  const submitting = useSelector(selectFavoriteSubmitting);

  const error = useSelector(selectFavoriteError);



  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(true);


  const [users, setUsers] = useState([]);

  const [properties, setProperties] = useState([]);

  const [apartments, setApartments] = useState([]);

  const [units, setUnits] = useState([]);



  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const [form, setForm] = useState({

    user_id: "",

    property_id: "",

    apartment_id: "",

    unit_id: "",

    notes: "",

    source: "manual",

    is_active: true,

  });



  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const [errors, setErrors] = useState({});



  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    dispatch(clearErrors());

    loadData();

  }, [id]);



  const loadData = async () => {

    try {

      setLoading(true);



      const [
        favoriteRes,
        usersRes,
        propertiesRes,
        apartmentsRes,
        unitsRes,

      ] = await Promise.all([

        api.get(`/property-favorites/${id}`),

        api.get("/users"),

        api.get("/properties"),

        api.get("/apartments"),

        api.get("/units"),

      ]);



      const favorite =
        favoriteRes?.data?.data ??
        favoriteRes?.data;



      setForm({

        user_id: favorite?.user?.id ??
          favorite?.user_id ??
          "",


        property_id: favorite?.property?.id ??
          favorite?.property_id ??
          "",


        apartment_id:
          favorite?.apartment?.id ??
          favorite?.apartment_id ??
          "",


        unit_id:
          favorite?.unit?.id ??
          favorite?.unit_id ??
          "",


        notes:
          favorite?.notes ??
          "",


        source:
          favorite?.source ??
          "manual",


        is_active:
          Boolean(favorite?.is_active),

      });



      setUsers(
        usersRes?.data?.data ?? []
      );


      setProperties(
        propertiesRes?.data?.data ?? []
      );


      setApartments(
        apartmentsRes?.data?.data ?? []
      );


      setUnits(
        unitsRes?.data?.data ?? []
      );



    } catch (err) {


      dispatch(
        addNotification({

          type: "error",

          message:
            err?.response?.data?.message ||
            "Failed to load property favorite.",

        })
      );


    } finally {

      setLoading(false);

    }

  };
    /*
  |--------------------------------------------------------------------------
  | INPUT CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (e) => {

    const {
      name,
      value,
      type,
      checked,

    } = e.target;


    setForm((prev)=>({

      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value,

    }));


    setErrors((prev)=>({

      ...prev,

      [name]: "",

    }));

  };



  /*
  |--------------------------------------------------------------------------
  | VALIDATE
  |--------------------------------------------------------------------------
  */

  const validate = () => {


    const validation = {};



    if(!form.user_id){

      validation.user_id =
        "User is required.";

    }



    if(!form.property_id){

      validation.property_id =
        "Property is required.";

    }



    setErrors(validation);


    return Object.keys(validation).length === 0;

  };



  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */


  const handleSubmit = async(e)=>{

    e.preventDefault();


    if(!validate()){

      dispatch(
        addNotification({

          type:"error",

          message:
            "Please correct the highlighted fields.",

        })
      );


      return;

    }



    try{


      await dispatch(

        updatePropertyFavorite({

          id,

          data:{

            ...form,

            apartment_id:
              form.apartment_id || null,

            unit_id:
              form.unit_id || null,

          }

        })

      ).unwrap();



      dispatch(

        addNotification({

          type:"success",

          message:
            "Property favorite updated successfully.",

        })

      );



      navigate(
        "/super-admin/property-favorites"
      );



    }catch(err){


      dispatch(

        addNotification({

          type:"error",

          message:
            err?.message ||
            "Update failed.",

        })

      );

    }

  };



  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if(loading){

    return (

      <div className="flex justify-center py-24">

        <Loader2
          className="w-10 h-10 animate-spin text-red-600"
        />

      </div>

    );

  }



  return (

    <div className="max-w-5xl mx-auto">

      <div className="bg-white rounded-xl shadow border mb-6">
                <div className="p-6 border-b">

          <Link
            to="/super-admin/property-favorites"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 mb-3"
          >

            <ArrowLeft size={16}/>

            Back to Property Favorites

          </Link>


          <h1 className="flex items-center gap-2 text-2xl font-bold">

            <Heart className="text-red-600 fill-red-500"/>

            Edit Property Favorite

          </h1>


          <p className="text-gray-500">

            Update favorite property assignment.

          </p>


        </div>



        {error && (

          <div className="m-6 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">

            <AlertTriangle className="text-red-600"/>


            <span className="text-red-700">

              {error?.message ||
               error ||
               "Something went wrong."}

            </span>

          </div>

        )}




<form
 onSubmit={handleSubmit}
 className="p-6"
>


<div className="grid grid-cols-1 md:grid-cols-2 gap-6">


{/* USER */}

<div>

<label className="block mb-2 font-medium">

User

</label>


<select

name="user_id"

value={form.user_id}

onChange={handleChange}

className="w-full border rounded-xl px-4 py-3"

>


<option value="">

Select User

</option>


{users.map(user=>(

<option
key={user.id}
value={user.id}
>

{user.first_name} {user.last_name}

</option>

))}


</select>


</div>




{/* PROPERTY */}

<div>

<label className="block mb-2 font-medium">

Property

</label>


<select

name="property_id"

value={form.property_id}

onChange={handleChange}

className="w-full border rounded-xl px-4 py-3"

>


<option value="">

Select Property

</option>


{properties.map(property=>(

<option
key={property.id}
value={property.id}
>

{property.title}

</option>

))}


</select>


</div>




{/* APARTMENT */}

<div>

<label className="block mb-2 font-medium">

Apartment

</label>


<select

name="apartment_id"

value={form.apartment_id}

onChange={handleChange}

className="w-full border rounded-xl px-4 py-3"

>


<option value="">

Select Apartment

</option>


{apartments.map(item=>(

<option
key={item.id}
value={item.id}
>

{item.name}

</option>

))}


</select>

</div>




{/* UNIT */}

<div>

<label className="block mb-2 font-medium">

Unit

</label>


<select

name="unit_id"

value={form.unit_id}

onChange={handleChange}

className="w-full border rounded-xl px-4 py-3"

>


<option value="">

Select Unit

</option>


{units.map(unit=>(

<option
key={unit.id}
value={unit.id}
>

{unit.name || unit.unit_number}

</option>

))}


</select>

</div>
{/* NOTES */}

<div className="md:col-span-2">

<label className="block mb-2 font-medium">

Notes

</label>


<textarea

name="notes"

rows="4"

value={form.notes}

onChange={handleChange}

className="w-full border rounded-xl px-4 py-3"

placeholder="Optional notes..."

></textarea>


</div>



{/* SOURCE */}

<div>

<label className="block mb-2 font-medium">

Source

</label>


<input

type="text"

name="source"

value={form.source}

onChange={handleChange}

className="w-full border rounded-xl px-4 py-3"

/>


</div>



{/* ACTIVE */}

<div className="flex items-center gap-3">


<input

type="checkbox"

name="is_active"

checked={form.is_active}

onChange={handleChange}

className="w-5 h-5"

/>


<label>

Favorite Active

</label>


</div>


</div>




<div className="flex justify-end gap-3 mt-8 border-t pt-6">


<button

type="button"

onClick={()=>navigate(-1)}

className="px-6 py-3 border rounded-xl"

>

Cancel

</button>



<button

type="submit"

disabled={submitting}

className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl"

>


{submitting ? (

<>

<Loader2 className="w-4 h-4 animate-spin"/>

Updating...

</>

):(


<>

<Save className="w-4 h-4"/>

Update Favorite

</>


)}


</button>


</div>


</form>


</div>


</div>


);

};


export default EditPropertyFavorite;