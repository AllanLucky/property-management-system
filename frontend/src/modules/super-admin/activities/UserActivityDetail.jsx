import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchActivity } from "../../../store/userActivitySlice";

import {
    ArrowLeft,
    User,
    Activity,
    Globe,
    Monitor,
    Loader2,
    BadgeCheck,
    Database,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| USER ACTIVITY DETAIL (AUDIT LOG VIEW)
|--------------------------------------------------------------------------
*/
export default function UserActivityDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { activity, loading } = useSelector(
        (state) => state.userActivity
    );

    /*
    |--------------------------------------------------------------------------
    | FETCH DATA
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        if (id) dispatch(fetchActivity(id));
    }, [id, dispatch]);

    /*
    |--------------------------------------------------------------------------
    | LOADING STATE
    |--------------------------------------------------------------------------
    */
    if (loading || !activity) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const meta = activity?.meta ?? {};

    const fullName = activity.user
        ? `${activity.user.first_name ?? ""} ${activity.user.last_name ?? ""}`.trim()
        : "System";

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <div className="text-center">
                    <h1 className="text-xl font-semibold text-gray-800">
                        Activity Details
                    </h1>
                    <p className="text-xs text-gray-500">
                        Audit Log #{activity.id}
                    </p>
                </div>

                <div />
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ACTIVITY */}
                <Card title="Activity" icon={<Activity className="text-blue-600" />}>
                    <InfoRow label="Action" value={activity.action} />
                    <InfoRow label="Description" value={activity.description || "-"} />

                    <InfoRow
                        label="Type"
                        value={
                            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                                {activity.type || "system"}
                            </span>
                        }
                    />

                    <InfoRow
                        label="Time"
                        value={new Date(activity.created_at).toLocaleString()}
                    />
                </Card>

                {/* USER (UPDATED PROFESSIONAL VERSION) */}
                <Card title="User" icon={<User className="text-green-600" />}>
                    <InfoRow label="Name" value={fullName} />
                    <InfoRow label="Email" value={activity.user?.email || "-"} />

                    {/* Professional ID Badge */}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">User ID</span>

                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 font-medium">
                            ID: {activity.user_id || "-"}
                        </span>
                    </div>
                </Card>

                {/* SYSTEM */}
                <Card title="System" icon={<Monitor className="text-purple-600" />}>
                    <InfoRow
                        label="IP Address"
                        value={
                            <span className="flex items-center gap-2">
                                <Globe size={14} />
                                {activity.ip_address || "-"}
                            </span>
                        }
                    />

                    <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">User Agent</p>
                        <p className="text-xs text-gray-600 bg-gray-100 p-2 rounded break-all">
                            {activity.user_agent || "-"}
                        </p>
                    </div>
                </Card>

                {/* SUBJECT */}
                <Card
                    title="Related Subject"
                    icon={<BadgeCheck className="text-orange-600" />}
                    full
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoRow label="Type" value={activity.subject_type || "-"} />
                        <InfoRow label="ID" value={activity.subject_id || "-"} />
                    </div>
                </Card>

                {/* METADATA */}
                <Card
                    title="Metadata"
                    icon={<Database className="text-gray-700" />}
                    full
                >
                    <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-80">
                        {JSON.stringify(meta, null, 2)}
                    </pre>
                </Card>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| REUSABLE COMPONENTS
|--------------------------------------------------------------------------
*/

const Card = ({ title, icon, children, full = false }) => (
    <div
        className={`bg-white border rounded-xl shadow-sm p-5 ${
            full ? "lg:col-span-3" : ""
        }`}
    >
        <div className="flex items-center gap-2 mb-4">
            {icon}
            <h2 className="font-semibold text-gray-800">{title}</h2>
        </div>

        <div className="space-y-3 text-sm">{children}</div>
    </div>
);

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between gap-4">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-800 font-medium text-right break-words">
            {value}
        </span>
    </div>
);