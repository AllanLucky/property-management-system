import { addNotification } from "../store/uiSlice";

/*
|--------------------------------------------------------------------------
| GLOBAL API ERROR HANDLER
|--------------------------------------------------------------------------
| Converts ANY backend error into a toast notification
| Works with axios, fetch, redux-thunks, etc.
|--------------------------------------------------------------------------
*/
export const handleApiError = (error, dispatch) => {
  if (!dispatch) {
    console.error("handleApiError: dispatch is required");
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Extract safest error message
  |--------------------------------------------------------------------------
  */
  let message = "Something went wrong. Please try again.";

  if (error?.response) {
    // Axios error structure
    message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.errors?.message ||
      message;
  } else if (error?.message) {
    // JS error or thrown error
    message = error.message;
  }

  /*
  |--------------------------------------------------------------------------
  | Optional: handle validation errors (Laravel style)
  |--------------------------------------------------------------------------
  */
  const validationErrors = error?.response?.data?.errors;

  if (validationErrors && typeof validationErrors === "object") {
    const firstKey = Object.keys(validationErrors)[0];
    const firstError = validationErrors[firstKey];

    if (Array.isArray(firstError)) {
      message = firstError[0];
    } else if (typeof firstError === "string") {
      message = firstError;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Dispatch toast notification
  |--------------------------------------------------------------------------
  */
  dispatch(
    addNotification({
      type: "error",
      message,
      sticky: true,
    })
  );
};