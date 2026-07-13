import { useState } from "react";
import api from "../../api/axios";
import { useDispatch } from "react-redux";

// TOAST
import { addNotification } from "../../store/uiSlice";

// UI COMPONENTS
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";

const ForgotPassword = () => {
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | SUBMIT FORGOT PASSWORD
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.post("/auth/forgot-password", {
        email,
      });

      const msg =
        res.data.message || "Reset link sent successfully";

      setMessage(msg);

      // 🔥 SUCCESS TOAST
      dispatch(
        addNotification({
          type: "success",
          message: msg,
        })
      );
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to send reset link";

      setError(msg);

      // ❌ ERROR TOAST
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

  return (
    <Card className="max-w-md mx-auto mt-10 p-6">

      {/* HEADER */}
      <h2 className="text-xl font-bold text-center mb-4">
        Forgot Password
      </h2>

      <p className="text-sm text-center text-gray-500 mb-6">
        Enter your email to receive a password reset link
      </p>

      {/* LOCAL SUCCESS MESSAGE */}
      {message && (
        <div className="mb-4 p-3 text-green-700 bg-green-100 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* LOCAL ERROR MESSAGE */}
      {error && (
        <div className="mb-4 p-3 text-red-700 bg-red-100 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">

        <Input
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button
          type="submit"
          disabled={loading || !email}
          className="w-full"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader size="sm" />
              Sending...
            </div>
          ) : (
            "Send Reset Link"
          )}
        </Button>

      </form>

    </Card>
  );
};

export default ForgotPassword;