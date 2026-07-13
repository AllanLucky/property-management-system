import api from "../api/axios";

/*
|--------------------------------------------------------------------------
| GET ALL PROPERTY CATEGORIES
|--------------------------------------------------------------------------
*/
export const getPropertyCategoriesApi = async (
  params = {}
) => {
  return await api.get(
    "/property-categories",
    {
      params,
    }
  );
};

/*
|--------------------------------------------------------------------------
| GET SINGLE PROPERTY CATEGORY
|--------------------------------------------------------------------------
*/
export const getPropertyCategoryApi = async (
  id,
  params = {}
) => {
  return await api.get(
    `/property-categories/${id}`,
    {
      params,
    }
  );
};

/*
|--------------------------------------------------------------------------
| CREATE PROPERTY CATEGORY
|--------------------------------------------------------------------------
*/
export const createPropertyCategoryApi = async (
  data
) => {
  return await api.post(
    "/property-categories",
    data,
    {
      headers:
        data instanceof FormData
          ? {
              "Content-Type":
                "multipart/form-data",
            }
          : {
              "Content-Type":
                "application/json",
            },
    }
  );
};

/*
|--------------------------------------------------------------------------
| UPDATE PROPERTY CATEGORY
|--------------------------------------------------------------------------
*/
export const updatePropertyCategoryApi = async (
  id,
  data
) => {
  return await api.post(
    `/property-categories/${id}`,
    data instanceof FormData
      ? (() => {
          data.append("_method", "PUT");
          return data;
        })()
      : {
          ...data,
          _method: "PUT",
        },
    {
      headers:
        data instanceof FormData
          ? {
              "Content-Type":
                "multipart/form-data",
            }
          : {
              "Content-Type":
                "application/json",
            },
    }
  );
};

/*
|--------------------------------------------------------------------------
| DELETE PROPERTY CATEGORY
|--------------------------------------------------------------------------
*/
export const deletePropertyCategoryApi =
  async (id) => {
    return await api.delete(
      `/property-categories/${id}`
    );
  };

/*
|--------------------------------------------------------------------------
| RESTORE PROPERTY CATEGORY
|--------------------------------------------------------------------------
*/
export const restorePropertyCategoryApi =
  async (id) => {
    return await api.post(
      `/property-categories/${id}/restore`
    );
  };

/*
|--------------------------------------------------------------------------
| FORCE DELETE PROPERTY CATEGORY
|--------------------------------------------------------------------------
*/
export const forceDeletePropertyCategoryApi =
  async (id) => {
    return await api.delete(
      `/property-categories/${id}/force-delete`
    );
  };

/*
|--------------------------------------------------------------------------
| TOGGLE FEATURED STATUS
|--------------------------------------------------------------------------
*/
export const toggleFeaturedPropertyCategoryApi =
  async (id) => {
    return await api.patch(
      `/property-categories/${id}/toggle-featured`
    );
  };

/*
|--------------------------------------------------------------------------
| UPDATE STATUS
|--------------------------------------------------------------------------
*/
export const updatePropertyCategoryStatusApi =
  async (id, status) => {
    return await api.patch(
      `/property-categories/${id}/status`,
      {
        status,
      }
    );
  };