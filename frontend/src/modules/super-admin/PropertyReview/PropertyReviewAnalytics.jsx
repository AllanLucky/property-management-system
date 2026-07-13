import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  MessageSquare,
  Star,
  ThumbsUp,
  ShieldCheck,
  Globe,
  GlobeLock,
  ShieldOff,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Award,
} from "lucide-react";

const PropertyReviewAnalytic = () => {
  const { reviews = [] } = useSelector(
    (state) => state.propertyReviews || {}
  );

  const analytics = useMemo(() => {
    const total = reviews.length;

    const published = reviews.filter(
      (review) => review.is_published
    ).length;

    const unpublished = total - published;

    const verified = reviews.filter(
      (review) => review.is_verified
    ).length;

    const unverified = total - verified;

    const positive = reviews.filter(
      (review) => review.is_positive
    ).length;

    const negative = reviews.filter(
      (review) => review.is_negative
    ).length;

    const neutral = total - positive - negative;

    const likes = reviews.reduce(
      (sum, review) => sum + (review.likes_count || 0),
      0
    );

    const averageRating =
      total > 0
        ? (
            reviews.reduce(
              (sum, review) => sum + Number(review.rating || 0),
              0
            ) / total
          ).toFixed(1)
        : 0;

    const ratingCounts = {
      5: reviews.filter((r) => Number(r.rating) === 5).length,
      4: reviews.filter((r) => Number(r.rating) === 4).length,
      3: reviews.filter((r) => Number(r.rating) === 3).length,
      2: reviews.filter((r) => Number(r.rating) === 2).length,
      1: reviews.filter((r) => Number(r.rating) === 1).length,
    };

    return {
      total,
      published,
      unpublished,
      verified,
      unverified,
      positive,
      negative,
      neutral,
      likes,
      averageRating,
      ratingCounts,
    };
  }, [reviews]);

  return (
    <div className="space-y-6">
      {/* ====================================================== */}
      {/* PAGE HEADER */}
      {/* ====================================================== */}

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <BarChart3 className="h-7 w-7 text-blue-600" />
              Property Review Analytics
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Insights, ratings, customer feedback performance and moderation
              statistics.
            </p>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* TOP STATS */}
      {/* ====================================================== */}

      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        <StatCard
          title="Total Reviews"
          value={analytics.total}
          color="blue"
          icon={<MessageSquare className="h-6 w-6" />}
        />

        <StatCard
          title="Average Rating"
          value={`${analytics.averageRating}/5`}
          color="yellow"
          icon={<Star className="h-6 w-6" />}
        />

        <StatCard
          title="Total Likes"
          value={analytics.likes}
          color="emerald"
          icon={<ThumbsUp className="h-6 w-6" />}
        />

        <StatCard
          title="Verified"
          value={analytics.verified}
          color="indigo"
          icon={<ShieldCheck className="h-6 w-6" />}
        />
      </div>

      {/* ====================================================== */}
      {/* STATUS */}
      {/* ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
            <Activity className="h-5 w-5 text-blue-600" />
            Review Status
          </h2>

          <div className="space-y-4">
            <ProgressRow
              title="Published"
              value={analytics.published}
              total={analytics.total}
              icon={<Globe className="h-4 w-4 text-green-600" />}
              color="bg-green-500"
            />

            <ProgressRow
              title="Draft"
              value={analytics.unpublished}
              total={analytics.total}
              icon={<GlobeLock className="h-4 w-4 text-gray-500" />}
              color="bg-gray-400"
            />

            <ProgressRow
              title="Verified"
              value={analytics.verified}
              total={analytics.total}
              icon={<ShieldCheck className="h-4 w-4 text-blue-600" />}
              color="bg-blue-500"
            />

            <ProgressRow
              title="Pending"
              value={analytics.unverified}
              total={analytics.total}
              icon={<ShieldOff className="h-4 w-4 text-red-500" />}
              color="bg-red-500"
            />
          </div>
        </div>

        {/* ====================================================== */}
        {/* SENTIMENT */}
        {/* ====================================================== */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
            <PieChart className="h-5 w-5 text-indigo-600" />
            Sentiment Analysis
          </h2>

          <div className="space-y-4">
            <ProgressRow
              title="Positive"
              value={analytics.positive}
              total={analytics.total}
              icon={<TrendingUp className="h-4 w-4 text-green-600" />}
              color="bg-green-500"
            />

            <ProgressRow
              title="Neutral"
              value={analytics.neutral}
              total={analytics.total}
              icon={<Activity className="h-4 w-4 text-yellow-500" />}
              color="bg-yellow-500"
            />

            <ProgressRow
              title="Negative"
              value={analytics.negative}
              total={analytics.total}
              icon={<TrendingDown className="h-4 w-4 text-red-600" />}
              color="bg-red-500"
            />
          </div>
        </div>

        {/* ====================================================== */}
        {/* RATING BREAKDOWN */}
        {/* ====================================================== */}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
            <Award className="h-5 w-5 text-yellow-500" />
            Rating Distribution
          </h2>

          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((rating) => (
              <ProgressRow
                key={rating}
                title={`${rating} Star`}
                value={analytics.ratingCounts[rating]}
                total={analytics.total}
                icon={<Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />}
                color="bg-yellow-500"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    emerald: "bg-emerald-100 text-emerald-600",
    indigo: "bg-indigo-100 text-indigo-600",
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

const ProgressRow = ({
  title,
  value,
  total,
  icon,
  color,
}) => {
  const percentage =
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}

          <span className="text-sm font-medium text-gray-700">
            {title}
          </span>
        </div>

        <span className="text-sm font-semibold text-gray-900">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`${color} h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-1 text-right text-xs text-gray-500">
        {percentage}%
      </p>
    </div>
  );
};

export default PropertyReviewAnalytic;