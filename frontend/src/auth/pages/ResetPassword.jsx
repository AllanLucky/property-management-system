import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /*
  |------------------------------------------
  | SAFE TOKEN + EMAIL EXTRACTION
  |------------------------------------------
  */
  const rawToken = searchParams.get("token") || "";
  const token = decodeURIComponent(rawToken)
    .split("&")[0]
    .replace(/^.*token=/, "")
    .trim();

  const email = decodeURIComponent(searchParams.get("email") || "").trim();

  /*
  |------------------------------------------
  | STATE
  |------------------------------------------
  */
  const [form, setForm] = useState({
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  /*
  |------------------------------------------
  | SYNC EMAIL FROM URL
  |------------------------------------------
  */
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      email: email || "",
    }));
  }, [email]);

  /*
  |------------------------------------------
  | INPUT HANDLER
  |------------------------------------------
  */
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /*
  |------------------------------------------
  | SUBMIT RESET PASSWORD
  |------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setMessage(null);
    setErrors({});

    try {

      const payload = {
        email: form.email.trim().toLowerCase(),
        token: token,
        password: form.password,
        password_confirmation: form.password_confirmation,
      };

      const res = await api.post("/auth/reset-password", payload);

      setMessage(res.data.message || "Password reset successful");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      const res = err.response?.data;

      setError(res?.message || "Reset password failed");

      if (res?.errors) {
        setErrors(res.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  /*
  |------------------------------------------
  | UI
  |------------------------------------------
  */
  return (
    <Card className="max-w-md mx-auto mt-10 p-6">

      <h2 className="text-xl font-bold text-center mb-4">
        Reset Password
      </h2>

      <p className="text-sm text-center text-gray-500 mb-6">
        Enter your new password below
      </p>

      {error && (
        <div className="mb-4 p-3 text-red-700 bg-red-100 rounded-lg text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 text-green-700 bg-green-100 rounded-lg text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* EMAIL */}
        <Input
          type="email"
          name="email"
          value={form.email}
          disabled={!!email}
          onChange={handleChange}
          required
        />

        {/* PASSWORD */}
        <Input
          type="password"
          name="password"
          placeholder="New Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        {errors.password && (
          <p className="text-red-500 text-xs">
            {errors.password[0]}
          </p>
        )}

        {/* CONFIRM PASSWORD */}
        <Input
          type="password"
          name="password_confirmation"
          placeholder="Confirm Password"
          value={form.password_confirmation}
          onChange={handleChange}
          required
        />
        {errors.password_confirmation && (
          <p className="text-red-500 text-xs">
            {errors.password_confirmation[0]}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || !token}
          className="w-full"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader size="sm" />
              Resetting...
            </div>
          ) : (
            "Reset Password"
          )}
        </Button>

      </form>
    </Card>
  );
};

export default ResetPassword;