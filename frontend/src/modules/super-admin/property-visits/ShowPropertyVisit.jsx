import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  Activity,
  Loader2,
  User,
  MapPin,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Clock3,
  BarChart3,
  TrendingUp,
  CalendarCheck,
  Bookmark,
  Share2,
  Phone,
  MessageCircle,
  Mail,
  Trash2,
} from "lucide-react";

import api from "../../../api/axios";


const PropertyVisitShow = () => {

  const { id } = useParams();
  const navigate = useNavigate();


  const [visit,setVisit] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);



  /*
  |--------------------------------------------------------------------------
  | FETCH VISIT
  |--------------------------------------------------------------------------
  */

  const fetchVisit = async()=>{

    try{

      setLoading(true);


      const response = await api.get(
        `/property-visits/${id}`
      );


      setVisit(
        response?.data?.data
      );


    }catch(err){

      setError(
        err?.response?.data?.message ||
        "Failed to load property visit"
      );

    }finally{

      setLoading(false);

    }

  };



  useEffect(()=>{

    fetchVisit();

  },[id]);





  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */


  const deletePropertyVisit = async()=>{


    const result = await Swal.fire({

      title:"Delete Property Visit?",

      text:"This action cannot be undone.",

      icon:"warning",

      showCancelButton:true,

      confirmButtonColor:"#d33",

      cancelButtonColor:"#3085d6",

      confirmButtonText:"Yes, delete it!"

    });



    if(!result.isConfirmed) return;



    try{


      await api.delete(
        `/property-visits/${id}`
      );



      await Swal.fire({

        icon:"success",

        title:"Deleted",

        text:"Property visit deleted successfully",

        timer:1500,

        showConfirmButton:false

      });



      navigate(
        "/super-admin/property-visits"
      );



    }catch(err){


      Swal.fire({

        icon:"error",

        title:"Delete Failed",

        text:
        err?.response?.data?.message ||
        "Unable to delete visit"

      });


    }


  };





  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */


  if(loading){

    return(

      <div className="flex justify-center py-24">

        <Loader2 className="h-10 w-10 animate-spin text-blue-600"/>

      </div>

    );

  }





  if(error){

    return(

      <div className="rounded-xl bg-red-50 p-5 text-red-600">

        {error}

      </div>

    );

  }





return (

<div className="space-y-6">



{/* HEADER */}

<div className="rounded-2xl border bg-white p-6 shadow-sm">


<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">


<div>


<h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">

<Activity className="h-8 w-8 text-blue-600"/>

Property Visit Details

</h1>


<p className="mt-2 text-sm text-gray-500">

Visitor analytics information

</p>


</div>




<div className="flex gap-3">


<Link

to="/super-admin/property-visits"

className="flex items-center gap-2 rounded-xl border px-4 py-2"

>

<ArrowLeft size={18}/>

Back

</Link>




<button

onClick={deletePropertyVisit}

className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-white"

>

<Trash2 size={18}/>

Delete

</button>



</div>


</div>


</div>







{/* PROPERTY */}

<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">



<div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">


<h2 className="mb-5 text-xl font-bold">

Visitor Information

</h2>



<div className="grid grid-cols-1 gap-5 md:grid-cols-2">


<Info

icon={<User/>}

label="Visitor"

value={
visit.user
?
`${visit.user.first_name} ${visit.user.last_name}`
:
"Guest Visitor"
}

/>



<Info

icon={<Globe/>}

label="Country"

value={visit.country || "-"}

/>


<Info

icon={<MapPin/>}

label="Location"

value={
`${visit.city || "-"}, ${visit.region || "-"}`
}

/>



<Info

icon={<Activity/>}

label="Visit UUID"

value={visit.visit_uuid}

/>



</div>


</div>





{/* DEVICE */}

<div className="rounded-2xl border bg-white p-6 shadow-sm">


<h2 className="mb-5 text-xl font-bold">

Device

</h2>



<DeviceCard visit={visit}/>



</div>



</div>









{/* ANALYTICS */}

<div className="rounded-2xl border bg-white p-6 shadow-sm">


<h2 className="mb-5 text-xl font-bold">

Engagement Analytics

</h2>



<div className="grid grid-cols-2 gap-4 md:grid-cols-4">


<Card
icon={<Clock3/>}
title="Duration"
value={`${visit.duration || 0}s`}
/>


<Card
icon={<BarChart3/>}
title="Page Views"
value={visit.page_views || 0}
/>


<Card
icon={<TrendingUp/>}
title="Scroll"
value={`${visit.scroll_percentage || 0}%`}
/>


<Card
icon={<CalendarCheck/>}
title="Scheduled"
value={
visit.scheduled_visit ? "Yes":"No"
}
/>


</div>


</div>









{/* ACTIONS */}

<div className="rounded-2xl border bg-white p-6 shadow-sm">


<h2 className="mb-5 text-xl font-bold">

Actions Performed

</h2>



<div className="flex flex-wrap gap-3">


<ActionBadge
show={visit.contact_clicked}
icon={<Phone/>}
text="Contact"
/>


<ActionBadge
show={visit.call_clicked}
icon={<Phone/>}
text="Call"
/>


<ActionBadge
show={visit.whatsapp_clicked}
icon={<MessageCircle/>}
text="WhatsApp"
/>


<ActionBadge
show={visit.email_clicked}
icon={<Mail/>}
text="Email"
/>


<ActionBadge
show={visit.bookmarked}
icon={<Bookmark/>}
text="Saved"
/>


<ActionBadge
show={visit.shared}
icon={<Share2/>}
text="Shared"
/>



</div>


</div>







</div>

);

};






const Info=({
icon,
label,
value
})=>(

<div className="flex gap-3">

<div className="text-blue-600">
{icon}
</div>

<div>

<p className="text-xs uppercase text-gray-400">
{label}
</p>

<p className="font-semibold text-gray-800">
{value}
</p>

</div>

</div>

);







const Card=({
icon,
title,
value
})=>(

<div className="rounded-xl border bg-gray-50 p-4">

<div className="flex items-center gap-2 text-blue-600">

{icon}

<span className="text-sm">
{title}
</span>

</div>


<p className="mt-2 text-2xl font-bold">
{value}
</p>


</div>

);








const DeviceCard=({visit})=>(

<div className="space-y-4">


{
visit.is_mobile ?

<Smartphone className="h-10 w-10 text-green-600"/>

:

visit.is_tablet ?

<Tablet className="h-10 w-10 text-purple-600"/>

:

<Monitor className="h-10 w-10 text-blue-600"/>

}


<p className="font-semibold">

{visit.device || "Desktop"}

</p>


<p className="text-sm text-gray-500">

{visit.browser || "-"} 

</p>


<p className="text-sm text-gray-500">

{visit.operating_system || "-"}

</p>



</div>

);






const ActionBadge=({
show,
icon,
text
})=>{


if(!Number(show)) return null;


return(

<span className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">

{icon}

{text}

</span>

);

};



export default PropertyVisitShow;