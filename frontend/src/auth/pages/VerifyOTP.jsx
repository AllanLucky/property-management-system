import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";

/*
|--------------------------------------------------------------------------
| UI COMPONENTS
|--------------------------------------------------------------------------
*/
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

/*
|--------------------------------------------------------------------------
| TOAST
|--------------------------------------------------------------------------
*/
import { addNotification } from "../../store/uiSlice";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | EMAIL SOURCE
  |--------------------------------------------------------------------------
  */
  const prefilledEmail =
    location.state?.email ||
    localStorage.getItem("verify_email") ||
    "";

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */
  const [form, setForm] = useState({
    email: prefilledEmail,
    otp: "",
  });

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | SAVE EMAIL
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (form.email) {
      localStorage.setItem("verify_email", form.email.trim());
    }
  }, [form.email]);

  /*
  |--------------------------------------------------------------------------
  | INPUT CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | FRONTEND VALIDATION (IMPORTANT FIX)
  |--------------------------------------------------------------------------
  */
  const validateVerify = () => {
    if (!form.email.trim()) {
      return "Email is required";
    }

    if (!form.otp.trim()) {
      return "OTP is required";
    }

    if (form.otp.trim().length !== 6) {
      return "OTP must be 6 digits";
    }

    return null;
  };

  /*
  |--------------------------------------------------------------------------
  | VERIFY OTP
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateVerify();

    if (validationError) {
      setError(validationError);

      dispatch(
        addNotification({
          type: "error",
          message: validationError,
        })
      );

      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post("/auth/verify-otp", {
        email: form.email.trim(),
        otp: form.otp.trim(),
      });

      const msg = res.data.message || "OTP verified successfully";

      setMessage(msg);

      dispatch(
        addNotification({
          type: "success",
          message: "OTP verified successfully 🎉",
        })
      );

      localStorage.removeItem("verify_email");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Invalid or expired OTP";

      setError(msg);

      dispatch(
        addNotification({
          type: "error",
          message: msg,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RESEND OTP
  |--------------------------------------------------------------------------
  */
  const handleResendOtp = async () => {
    if (!form.email.trim()) {
      const msg = "Email is required to resend OTP";

      setError(msg);

      dispatch(
        addNotification({
          type: "error",
          message: msg,
        })
      );

      return;
    }

    setResending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post("/auth/resend-otp", {
        email: form.email.trim(),
      });

      const msg = res.data.message || "OTP resent successfully";

      setMessage(msg);

      dispatch(
        addNotification({
          type: "success",
          message: "OTP resent successfully 📩",
        })
      );
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to resend OTP";

      setError(msg);

      dispatch(
        addNotification({
          type: "error",
          message: msg,
        })
      );
    } finally {
      setResending(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      <Card className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">

        {/* HEADER */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Verify OTP
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Enter the OTP sent to your email
          </p>
        </div>

        {/* SUCCESS */}
        {message && (
          <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 border border-green-200 rounded-lg text-center">
            {message}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>

            <Input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* OTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OTP Code
            </label>

            <Input
              type="text"
              name="otp"
              value={form.otp}
              onChange={handleChange}
              maxLength={6}
              className="text-center tracking-[0.4em] text-lg font-semibold"
              required
            />
          </div>

          {/* VERIFY BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>

        {/* RESEND OTP */}
        <div className="mt-5 text-center">
          <button
            onClick={handleResendOtp}
            disabled={resending}
            className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
          >
            {resending ? "Resending OTP..." : "Resend OTP"}
          </button>
        </div>

      </Card>
    </div>
  );
};

export default VerifyOTP;