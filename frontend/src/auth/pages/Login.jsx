import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

import { loginUser } from "../../store/authSlice";
import { addNotification } from "../../store/uiSlice";

import { handleApiError } from "../../utils/handleApiError";

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
| ICONS
|--------------------------------------------------------------------------
*/
import {
  Loader2,
  ShieldCheck,
  Ban,
  Clock3,
  UserX,
  AlertTriangle,
  Mail,
  LockKeyhole,
} from "lucide-react";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | ROLE REDIRECT
  |--------------------------------------------------------------------------
  */
  const redirectByRole = (roles = []) => {
    const normalizedRoles = roles.map((role) =>
      typeof role === "string" ? role.toLowerCase() : role?.name?.toLowerCase()
    );

    if (normalizedRoles.includes("super-admin"))
      return "/super-admin/dashboard";
    if (normalizedRoles.includes("admin")) return "/admin/dashboard";
    if (normalizedRoles.includes("landlord")) return "/landlord/dashboard";
    if (normalizedRoles.includes("tenant")) return "/tenant/dashboard";
    if (normalizedRoles.includes("agent")) return "/agent/dashboard";

    return "/unauthorized";
  };

  /*
  |--------------------------------------------------------------------------
  | ERROR ICON
  |--------------------------------------------------------------------------
  */
  const getErrorIcon = () => {
    const msg = error?.toLowerCase() || "";

    if (msg.includes("banned")) return <Ban className="w-5 h-5 text-red-600" />;
    if (msg.includes("suspended")) return <Clock3 className="w-5 h-5 text-yellow-600" />;
    if (msg.includes("inactive")) return <UserX className="w-5 h-5 text-gray-600" />;
    if (msg.includes("approval") || msg.includes("pending"))
      return <ShieldCheck className="w-5 h-5 text-blue-600" />;

    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  /*
  |--------------------------------------------------------------------------
  | LOGIN HANDLER (FIXED + GLOBAL ERROR HANDLING)
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      const response = await dispatch(loginUser(form)).unwrap();

      const user = response?.user || response?.data?.user || {};
      const roles = user?.roles || response?.roles || [];

      dispatch(
        addNotification({
          type: "success",
          message: "Login successful 🎉 Welcome back!",
        })
      );

      navigate(redirectByRole(roles), { replace: true });
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Invalid email or password.";

      // validation errors (Laravel style)
      if (err?.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      }

      setError(message);

      // 🔥 GLOBAL TOAST (THIS FIXES YOUR ISSUE)
      handleApiError(err, dispatch);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-blue-50 to-gray-100 px-4 py-10">
      <Card className="w-full max-w-md p-8 shadow-2xl rounded-3xl bg-white border border-gray-100">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>

          <p className="text-gray-500 mt-2 text-sm">
            Sign in to continue to your dashboard
          </p>
        </div>

        {/* ERROR ALERT (UI fallback) */}
        {error && (
          <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl">
            <div className="mt-0.5">{getErrorIcon()}</div>

            <div>
              <p className="font-semibold">Login Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="pl-10"
              />
            </div>

            {validationErrors?.email && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors.email[0]}
              </p>
            )}
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="pl-10"
              />
            </div>

            {validationErrors?.password && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors.password[0]}
              </p>
            )}
          </div>

          {/* BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-medium transition ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging in...
              </div>
            ) : (
              "Login"
            )}
          </Button>
        </form>

        {/* LINKS */}
        <div className="mt-6 text-center text-sm">
          <Link
            to="/forgot-password"
            className="text-blue-600 hover:underline font-medium"
          >
            Forgot Password?
          </Link>

          <div className="mt-4">
            <span className="text-gray-500">Don&apos;t have an account?</span>

            <Link
              to="/register"
              className="ml-1 text-green-600 hover:underline font-semibold"
            >
              Create Account
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;