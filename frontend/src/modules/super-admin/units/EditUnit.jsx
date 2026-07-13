import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { Loader2 } from "lucide-react";

const EditUnit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    type: "",
    unit_number: "",
    rent_amount: "",
    deposit_amount: "",
    status: "vacant",
  });

  /*
  |--------------------------------------------------------------------------
  | FETCH UNIT
  |--------------------------------------------------------------------------
  */
  const fetchUnit = async () => {
    setFetching(true);

    try {
      const res = await api.get(`/units/${id}`);

      const data = res.data?.data || res.data || {};

      setForm({
        name: data.name || "",
        type: data.type || "",
        unit_number: data.unit_number || "",
        rent_amount: data.rent_amount ?? "",
        deposit_amount: data.deposit_amount ?? "",
        status: data.status || "vacant",
      });
    } catch (err) {
      console.error("FAILED TO LOAD UNIT", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUnit();
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE UNIT
  |--------------------------------------------------------------------------
  */
  const handleUpdate = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...form,
        _method: "PUT",
        rent_amount: Number(form.rent_amount || 0),
        deposit_amount: Number(form.deposit_amount || 0),
      };

      await api.post(`/units/${id}`, payload);

      navigate("/super-admin/units");
    } catch (err) {
      console.error("UPDATE ERROR:", err);

      const apiErrors =
        err?.response?.data?.errors ||
        err?.errors ||
        {};

      setErrors(apiErrors);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */
  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-sm mt-2">Loading unit...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        Edit Unit
      </h1>

      <form onSubmit={handleUpdate} className="space-y-4">

        {/* NAME */}
        <div>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Unit name"
            className="w-full border p-3 rounded"
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name[0]}</p>
          )}
        </div>

        {/* TYPE */}
        <div>
          <input
            name="type"
            value={form.type}
            onChange={handleChange}
            placeholder="Type"
            className="w-full border p-3 rounded"
          />
          {errors.type && (
            <p className="text-red-500 text-sm">{errors.type[0]}</p>
          )}
        </div>

        {/* UNIT NUMBER */}
        <div>
          <input
            name="unit_number"
            value={form.unit_number}
            onChange={handleChange}
            placeholder="Unit number"
            className="w-full border p-3 rounded"
          />
          {errors.unit_number && (
            <p className="text-red-500 text-sm">
              {errors.unit_number[0]}
            </p>
          )}
        </div>

        {/* RENT */}
        <div>
          <input
            name="rent_amount"
            value={form.rent_amount}
            onChange={handleChange}
            placeholder="Rent"
            type="number"
            className="w-full border p-3 rounded"
          />
          {errors.rent_amount && (
            <p className="text-red-500 text-sm">
              {errors.rent_amount[0]}
            </p>
          )}
        </div>

        {/* DEPOSIT */}
        <div>
          <input
            name="deposit_amount"
            value={form.deposit_amount}
            onChange={handleChange}
            placeholder="Deposit"
            type="number"
            className="w-full border p-3 rounded"
          />
          {errors.deposit_amount && (
            <p className="text-red-500 text-sm">
              {errors.deposit_amount[0]}
            </p>
          )}
        </div>

        {/* STATUS */}
        <div>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border p-3 rounded"
          >
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>

          {errors.status && (
            <p className="text-red-500 text-sm">
              {errors.status[0]}
            </p>
          )}
        </div>

        {/* BUTTON */}
        <button
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded flex items-center justify-center gap-2"
        >
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {loading ? "Updating..." : "Update Unit"}
        </button>

      </form>
    </div>
  );
};

export default EditUnit;