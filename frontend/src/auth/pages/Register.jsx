import { useState } from "react";
import api from "../../api/axios";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

/*
|--------------------------------------------------------------------------
| UI COMPONENTS
|--------------------------------------------------------------------------
*/
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

/*
|--------------------------------------------------------------------------
| UI NOTIFICATIONS
|--------------------------------------------------------------------------
*/
import { addNotification } from "../../store/uiSlice";

/*
|--------------------------------------------------------------------------
| HELPER: extract error message safely
|--------------------------------------------------------------------------
*/
const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Registration failed"
  );
};

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    roles: [],
    permissions: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
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
  | SUBMIT
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setErrors({});

    try {
      const res = await api.post("/auth/register", form);

      const data = res?.data;

      dispatch(
        addNotification({
          type: "success",
          message:
            data?.message ||
            "Account created successfully! Verify your email.",
        })
      );

      localStorage.setItem("verify_email", form.email);

      navigate("/verify-otp", {
        state: { email: form.email },
        replace: true,
      });
    } catch (err) {
      const backend = err?.response?.data;

      console.error("REGISTER ERROR:", backend || err);

      /*
      |--------------------------------------------------------------------------
      | VALIDATION ERRORS (Laravel)
      |--------------------------------------------------------------------------
      */
      if (backend?.errors) {
        setErrors(backend.errors);

        dispatch(
          addNotification({
            type: "warning",
            message: backend?.message || "Please fix validation errors.",
            sticky: true,
          })
        );

        setError(backend?.message || "Validation error");
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | GENERAL ERROR (IMPORTANT FIX FOR YOUR CASE)
      |--------------------------------------------------------------------------
      */
      const message = getErrorMessage(err);

      setError(message);

      dispatch(
        addNotification({
          type: "error",
          message,
          sticky: true,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">

        <h2 className="text-2xl font-bold text-center mb-6">
          Create Account
        </h2>

        {/* GLOBAL ERROR */}
        {error && (
          <div className="mb-4 text-sm text-red-600 text-center bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <Input
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            error={errors.first_name?.[0]}
          />

          <Input
            label="Last Name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            error={errors.last_name?.[0]}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email?.[0]}
          />

          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone?.[0]}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password?.[0]}
          />

          <Input
            label="Confirm Password"
            name="password_confirmation"
            type="password"
            value={form.password_confirmation}
            onChange={handleChange}
            error={errors.password_confirmation?.[0]}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white"
          >
            {loading ? "Creating account..." : "Register"}
          </Button>
        </form>

        <p className="text-center text-sm mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>

      </Card>
    </div>
  );
};

export default Register;