import {
  useCallback,
  useState,
} from "react";

import apartmentAPI from "../api/apartment.api";


const useApartment = () => {


  const [apartments, setApartments] = useState([]);


  const [apartment, setApartment] = useState(null);


  const [loading, setLoading] = useState(false);


  const [error, setError] = useState(null);


  const [message, setMessage] = useState(null);



  const [pagination, setPagination] = useState({

    currentPage: 1,

    lastPage: 1,

    total: 0,

  });





  /*
  |--------------------------------------------------------------------------
  | GET APARTMENTS
  |--------------------------------------------------------------------------
  */

  const getApartments = useCallback(

    async (params = {}) => {


      try {


        setLoading(true);

        setError(null);



        const response =
          await apartmentAPI.getPaginated(params);



        /*
        Laravel API Response

        {
          status:true,
          message:"Apartments fetched successfully",
          data:[]
        }

        */



        const data =
          response?.data ?? [];



        setApartments(
          Array.isArray(data)
            ? data
            : []
        );





        /*
        Pagination Support
        */

        if(response?.meta){


          setPagination({

            currentPage:
              response.meta.current_page ?? 1,


            lastPage:
              response.meta.last_page ?? 1,


            total:
              response.meta.total ?? 0,

          });


        } else {


          setPagination({

            currentPage: 1,

            lastPage: 1,

            total: data.length,

          });


        }





        setMessage(
          response?.message ?? null
        );



        return response;



      } catch (err) {


        setError(

          err?.response?.data?.message ||

          "Unable to load apartments"

        );


      } finally {


        setLoading(false);


      }


    },

    []

  );








  /*
  |--------------------------------------------------------------------------
  | GET SINGLE APARTMENT
  |--------------------------------------------------------------------------
  */

  const getApartment = useCallback(

    async (id) => {


      try {


        setLoading(true);

        setError(null);



        const response =
          await apartmentAPI.getById(id);



        setApartment(
          response?.data ?? null
        );



        return response;



      } catch(err) {


        setError(

          err?.response?.data?.message ||

          "Unable to load apartment"

        );


      } finally {


        setLoading(false);


      }


    },

    []

  );








  /*
  |--------------------------------------------------------------------------
  | CREATE APARTMENT
  |--------------------------------------------------------------------------
  */

  const createApartment = async (payload) => {


    try {


      setLoading(true);

      setError(null);



      const response =
        await apartmentAPI.create(payload);



      setMessage(
        response?.message
      );



      return response;



    } catch(err) {


      setError(

        err?.response?.data?.message ||

        "Unable to create apartment"

      );


      throw err;



    } finally {


      setLoading(false);


    }


  };








  /*
  |--------------------------------------------------------------------------
  | UPDATE APARTMENT
  |--------------------------------------------------------------------------
  */

  const updateApartment = async (
    id,
    payload
  ) => {


    try {


      setLoading(true);

      setError(null);



      const response =
        await apartmentAPI.update(
          id,
          payload
        );



      setMessage(
        response?.message
      );



      return response;



    } catch(err) {


      setError(

        err?.response?.data?.message ||

        "Unable to update apartment"

      );


      throw err;



    } finally {


      setLoading(false);


    }


  };








  /*
  |--------------------------------------------------------------------------
  | DELETE APARTMENT
  |--------------------------------------------------------------------------
  */

  const deleteApartment = async (id) => {


    try {


      setLoading(true);

      setError(null);



      const response =
        await apartmentAPI.delete(id);



      setApartments((prev) =>

        prev.filter(
          item => item.id !== id
        )

      );



      setMessage(
        response?.message
      );



      return response;



    } catch(err) {


      setError(

        err?.response?.data?.message ||

        "Unable to delete apartment"

      );


      throw err;



    } finally {


      setLoading(false);


    }


  };








  return {


    // Data

    apartments,

    apartment,



    // States

    loading,

    error,

    message,

    pagination,



    // Actions

    getApartments,

    getApartment,

    createApartment,

    updateApartment,

    deleteApartment,


  };


};


export default useApartment;