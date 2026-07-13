import { useEffect, useState, useCallback } from "react";
import api from "../../../api/axios";
import { useDispatch } from "react-redux";
import { addNotification } from "../../../store/uiSlice";


/*
|--------------------------------------------------------------------------
| DEFAULT FORM STATE
|--------------------------------------------------------------------------
*/
const defaultForm = {
  first_name: "",
  last_name: "",
  phone: "",
  address: "",
  bio: "",
  gender: "",
  nationality: "",
  date_of_birth: "",
};


/*
|--------------------------------------------------------------------------
| DEFAULT PASSWORD STATE
|--------------------------------------------------------------------------
*/
const defaultPassword = {
  old_password: "",
  new_password: "",
  new_password_confirmation: "",
};


/*
|--------------------------------------------------------------------------
| PROFILE COMPONENT
|--------------------------------------------------------------------------
*/
const Profile = () => {

  const dispatch = useDispatch();


  /*
  |--------------------------------------------------------------------------
  | GENERAL STATES
  |--------------------------------------------------------------------------
  */
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);


  /*
  |--------------------------------------------------------------------------
  | PROFILE STATES
  |--------------------------------------------------------------------------
  */
  const [form, setForm] = useState(defaultForm);


  const [meta, setMeta] = useState({
    image: "",
    image_public_id: "",
    account_status: "",
    approval_status: "",
    last_login_at: "",
  });


  /*
  |--------------------------------------------------------------------------
  | IMAGE STATES
  |--------------------------------------------------------------------------
  */
  const [avatar, setAvatar] = useState(null);

  const [avatarPreview, setAvatarPreview] =
    useState(null);


  /*
  |--------------------------------------------------------------------------
  | PASSWORD STATE
  |--------------------------------------------------------------------------
  */
  const [passwordForm, setPasswordForm] =
    useState(defaultPassword);


  /*
  |--------------------------------------------------------------------------
  | FETCH USER PROFILE
  |--------------------------------------------------------------------------
  */
  const fetchProfile = useCallback(async () => {

    setLoading(true);

    try {

      const response = await api.get("/profile");


      const user =
        response?.data?.data || {};


      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
        gender: user.gender || "",
        nationality: user.nationality || "",
        date_of_birth: user.date_of_birth
          ? user.date_of_birth.split("T")[0]
          : "",
      });


      setMeta({
        image: user.image || "",
        image_public_id:
          user.image_public_id || "",

        account_status:
          user.account_status || "",

        approval_status:
          user.approval_status || "",

        last_login_at:
          user.last_login_at || "",
      });


      setAvatarPreview(
        user.image_url ||
        user.image ||
        null
      );


    } catch (error) {

      console.error(
        "PROFILE FETCH ERROR:",
        error
      );


      dispatch(
        addNotification({
          type: "error",
          message:
            "Failed to load your profile.",
        })
      );

    } finally {

      setLoading(false);
    }

  }, [dispatch]);


  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */
  useEffect(() => {

    fetchProfile();

  }, [fetchProfile]);


  /*
  |--------------------------------------------------------------------------
  | HANDLE INPUT CHANGES
  |--------------------------------------------------------------------------
  */
  const handleChange = (event) => {

    const {
      name,
      value
    } = event.target;


    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  /*
  |--------------------------------------------------------------------------
  | HANDLE PASSWORD INPUTS
  |--------------------------------------------------------------------------
  */
  const handlePasswordInput = (event) => {

    const {
      name,
      value
    } = event.target;


    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  /*
  |--------------------------------------------------------------------------
  | HANDLE AVATAR SELECTION
  |--------------------------------------------------------------------------
  */
  const handleAvatarChange = (event) => {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    /*
    |--------------------------------------------------------------------------
    | FILE SIZE VALIDATION
    | Max: 5MB
    |--------------------------------------------------------------------------
    */
    if (file.size > 5 * 1024 * 1024) {

      dispatch(
        addNotification({
          type: "error",
          message:
            "Image size must not exceed 5MB.",
        })
      );

      return;
    }


    /*
    |--------------------------------------------------------------------------
    | IMAGE TYPE VALIDATION
    |--------------------------------------------------------------------------
    */
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];


    if (!allowedTypes.includes(file.type)) {

      dispatch(
        addNotification({
          type: "error",
          message:
            "Only JPG, PNG, WEBP and GIF images are allowed.",
        })
      );

      return;
    }


    setAvatar(file);


    const previewUrl =
      URL.createObjectURL(file);


    setAvatarPreview(previewUrl);
  };


  /*
  |--------------------------------------------------------------------------
  | UPLOAD PROFILE IMAGE
  |--------------------------------------------------------------------------
  */
  const uploadAvatar = async () => {
  if (!avatar) {
    dispatch(addNotification({
      type: "warning",
      message: "Please select an image first.",
    }));
    return;
  }

  setUploadingImage(true);

  try {
    const formData = new FormData();

    // IMPORTANT: match Laravel controller field name
    formData.append("image", avatar);

    const response = await api.post("/profile/upload-avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("UPLOAD RESPONSE:", response.data);

    dispatch(addNotification({
      type: "success",
      message: "Profile image updated successfully.",
    }));

    setAvatar(null);
    setAvatarPreview(null);

    await fetchProfile();

  } catch (error) {
    console.error("AVATAR UPLOAD ERROR:", error);

    dispatch(addNotification({
      type: "error",
      message:
        error?.response?.data?.message ||
        "Failed to upload profile image.",
    }));
  } finally {
    setUploadingImage(false);
  }
};
  /*
|--------------------------------------------------------------------------
| UPDATE PROFILE INFORMATION
|--------------------------------------------------------------------------
*/
  const handleProfileUpdate = async (event) => {

    event.preventDefault();

    setSaving(true);


    try {

      await api.put(
        "/profile",
        form
      );


      dispatch(
        addNotification({
          type: "success",
          message:
            "Profile updated successfully.",
        })
      );


      await fetchProfile();


    } catch (error) {

      console.error(
        "PROFILE UPDATE ERROR:",
        error
      );


      dispatch(
        addNotification({
          type: "error",
          message:
            error?.response?.data?.message ||
            "Failed to update profile.",
        })
      );


    } finally {

      setSaving(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | CHANGE PASSWORD
  |--------------------------------------------------------------------------
  */
  const handleChangePassword = async (event) => {

    event.preventDefault();


    if (
      passwordForm.new_password !==
      passwordForm.new_password_confirmation
    ) {

      dispatch(
        addNotification({
          type: "error",
          message:
            "Password confirmation does not match.",
        })
      );

      return;
    }


    setChangingPassword(true);


    try {

      await api.post(
        "/profile/change-password",
        passwordForm
      );


      setPasswordForm(
        defaultPassword
      );


      dispatch(
        addNotification({
          type: "success",
          message:
            "Password changed successfully.",
        })
      );


    } catch (error) {


      console.error(
        "PASSWORD CHANGE ERROR:",
        error
      );


      dispatch(
        addNotification({
          type: "error",
          message:
            error?.response?.data?.message ||
            "Failed to change password.",
        })
      );


    } finally {

      setChangingPassword(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | LOADING SCREEN
  |--------------------------------------------------------------------------
  */
  if (loading) {

    return (
      <div className="p-8 text-center text-gray-500">
        Loading your profile...
      </div>
    );
  }


  return (

    <div className="
      bg-white
      dark:bg-slate-900
      rounded-2xl
      shadow-lg
      border
      border-gray-200
      dark:border-slate-700
      p-6
      space-y-6
    ">


      {/*
      |--------------------------------------------------------------------------
      | PAGE HEADER
      |--------------------------------------------------------------------------
      */}
      <div className="
        border-b
        border-gray-200
        dark:border-slate-700
        pb-4
      ">

        <h1 className="
          text-3xl
          font-bold
          text-gray-800
          dark:text-white
        ">
          My Profile
        </h1>


        <p className="
          text-sm
          text-gray-500
          mt-1
        ">
          Manage your personal information,
          profile image and account settings.
        </p>

      </div>


      {/*
      |--------------------------------------------------------------------------
      | PROFILE IMAGE CARD
      |--------------------------------------------------------------------------
      */}
      <div className="flex flex-col md:flex-row items-center gap-5">
        {/* Avatar */}
        <img
          src={
            avatarPreview ||
            "https://ui-avatars.com/api/?name=User"
          }
          alt="Profile Avatar"
          className="
      w-28
      h-28
      rounded-full
      object-cover
      border-4
      border-blue-500
      shadow-md
    "
        />

        {/* Choose Image */}
        <div>
          <label
            htmlFor="avatar-upload"
            className="
        cursor-pointer
        px-5
        py-3
        rounded-lg
        border
        border-gray-300
        bg-white
        hover:border-blue-500
        hover:text-blue-600
        transition
        font-medium
        inline-block
      "
          >
            📷 Choose Image
          </label>

          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Upload Button */}
        <button
          type="button"
          onClick={uploadAvatar}
          disabled={uploadingImage || !avatar}
          className="
      px-6
      py-3
      rounded-lg
      bg-blue-600
      hover:bg-blue-700
      text-white
      font-medium
      transition
      disabled:opacity-50
      disabled:cursor-not-allowed
    "
        >
          {uploadingImage
            ? "Uploading..."
            : "Upload Image"}
        </button>
      </div>


      {/*
      |--------------------------------------------------------------------------
      | ACCOUNT INFORMATION CARD
      |--------------------------------------------------------------------------
      */}
      <div className="
        grid
        grid-cols-1
        md:grid-cols-3
        gap-4
      ">


        <div className="
          p-4
          rounded-lg
          bg-blue-50
        ">

          <p className="text-sm text-gray-500">
            Account Status
          </p>

          <h3 className="
            text-lg
            font-bold
            capitalize
          ">
            {meta.account_status || "N/A"}
          </h3>

        </div>


        <div className="
          p-4
          rounded-lg
          bg-green-50
        ">

          <p className="text-sm text-gray-500">
            Approval Status
          </p>


          <h3 className="
            text-lg
            font-bold
            capitalize
          ">
            {meta.approval_status || "N/A"}
          </h3>

        </div>


        <div className="
          p-4
          rounded-lg
          bg-purple-50
        ">

          <p className="text-sm text-gray-500">
            Last Login
          </p>


          <h3 className="
            text-sm
            font-semibold
          ">
            {
              meta.last_login_at ||
              "Never"
            }
          </h3>

        </div>

      </div>
      {/*
      |--------------------------------------------------------------------------
      | PROFILE INFORMATION FORM
      |--------------------------------------------------------------------------
      */}
      <form
        onSubmit={handleProfileUpdate}
        className="
          bg-gray-50
          dark:bg-slate-800
          rounded-xl
          p-6
          shadow-sm
          space-y-5
        "
      >

        <h2 className="
          text-lg
          font-semibold
          text-gray-800
          dark:text-white
        ">
          Personal Information
        </h2>


        <div className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-4
        ">

          {/* First Name */}
          <div>

            <label className="block mb-2 text-sm font-medium">
              First Name
            </label>

            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              className="
                w-full
                rounded-lg
                border
                p-3
                focus:ring-2
                focus:ring-blue-500
                outline-none
              "
              placeholder="Enter first name"
            />

          </div>


          {/* Last Name */}
          <div>

            <label className="block mb-2 text-sm font-medium">
              Last Name
            </label>

            <input
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              className="
                w-full
                rounded-lg
                border
                p-3
                focus:ring-2
                focus:ring-blue-500
                outline-none
              "
              placeholder="Enter last name"
            />

          </div>


          {/* Phone */}
          <div>

            <label className="block mb-2 text-sm font-medium">
              Phone Number
            </label>

            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter phone number"
            />

          </div>


          {/* Gender */}
          <div>

            <label className="block mb-2 text-sm font-medium">
              Gender
            </label>

            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">
                Select gender
              </option>

              <option value="male">
                Male
              </option>

              <option value="female">
                Female
              </option>

              <option value="other">
                Other
              </option>

            </select>

          </div>


          {/* Nationality */}
          <div>

            <label className="block mb-2 text-sm font-medium">
              Nationality
            </label>

            <input
              type="text"
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
              className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter nationality"
            />

          </div>


          {/* Date of Birth */}
          <div>

            <label className="block mb-2 text-sm font-medium">
              Date of Birth
            </label>

            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />

          </div>

        </div>


        {/* Address */}
        <div>

          <label className="block mb-2 text-sm font-medium">
            Address
          </label>

          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter your address"
          />

        </div>


        {/* Bio */}
        <div>

          <label className="block mb-2 text-sm font-medium">
            Biography
          </label>

          <textarea
            rows="5"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Tell us about yourself"
          />

        </div>


        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="
            w-full
            bg-green-600
            hover:bg-green-700
            text-white
            py-3
            rounded-lg
            font-medium
            transition
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >

          {
            saving
              ? "Saving Changes..."
              : "Update Profile"
          }

        </button>

      </form>


      {/*
      |--------------------------------------------------------------------------
      | CHANGE PASSWORD SECTION
      |--------------------------------------------------------------------------
      */}
      <form
        onSubmit={handleChangePassword}
        className="
          bg-gray-50
          dark:bg-slate-800
          rounded-xl
          p-6
          shadow-sm
          space-y-5
        "
      >

        <h2 className="
          text-lg
          font-semibold
          text-gray-800
          dark:text-white
        ">
          Security Settings
        </h2>


        <input
          type="password"
          name="old_password"
          value={passwordForm.old_password}
          onChange={handlePasswordInput}
          className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Current password"
        />


        <input
          type="password"
          name="new_password"
          value={passwordForm.new_password}
          onChange={handlePasswordInput}
          className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="New password"
        />


        <input
          type="password"
          name="new_password_confirmation"
          value={passwordForm.new_password_confirmation}
          onChange={handlePasswordInput}
          className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Confirm new password"
        />


        <button
          type="submit"
          disabled={changingPassword}
          className="
            w-full
            bg-red-600
            hover:bg-red-700
            text-white
            py-3
            rounded-lg
            font-medium
            transition
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >

          {
            changingPassword
              ? "Updating Password..."
              : "Change Password"
          }

        </button>

      </form>

    </div>

  );

};


export default Profile;