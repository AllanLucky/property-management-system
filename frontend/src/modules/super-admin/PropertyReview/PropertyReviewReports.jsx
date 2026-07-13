import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  FileBarChart,
  FileText,
  Download,
  Printer,
  Calendar,
  MessageSquare,
  Star,
  ShieldCheck,
  ShieldOff,
  Globe,
  GlobeLock,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
} from "lucide-react";

const PropertyReviewReports = () => {
  const { reviews = [] } = useSelector(
    (state) => state.propertyReviews || {}
  );

  const report = useMemo(() => {
    const total = reviews.length;

    const published = reviews.filter(
      (r) => r.is_published
    ).length;

    const draft = total - published;

    const verified = reviews.filter(
      (r) => r.is_verified
    ).length;

    const pending = total - verified;

    const positive = reviews.filter(
      (r) => r.is_positive
    ).length;

    const negative = reviews.filter(
      (r) => r.is_negative
    ).length;

    const average =
      total > 0
        ? (
            reviews.reduce(
              (sum, r) => sum + Number(r.rating || 0),
              0
            ) / total
          ).toFixed(1)
        : "0.0";

    const likes = reviews.reduce(
      (sum, r) => sum + (r.likes_count || 0),
      0
    );

    const topReview =
      [...reviews].sort(
        (a, b) =>
          (b.likes_count || 0) -
          (a.likes_count || 0)
      )[0] || null;

    return {
      total,
      published,
      draft,
      verified,
      pending,
      positive,
      negative,
      average,
      likes,
      topReview,
    };
  }, [reviews]);

  return (
    <div className="space-y-6">

      {/* ======================================================= */}
      {/* HEADER */}
      {/* ======================================================= */}

      <div className="rounded-2xl border bg-white shadow-sm">

        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">

              <FileBarChart className="h-7 w-7 text-blue-600" />

              Property Review Reports

            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Generate and monitor reports for customer property reviews,
              moderation and performance.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <button
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <button
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>

          </div>

        </div>

      </div>

      {/* ======================================================= */}
      {/* SUMMARY */}
      {/* ======================================================= */}

      <div className="grid grid-cols-2 gap-5 xl:grid-cols-5">

        <ReportCard
          title="Total Reviews"
          value={report.total}
          icon={<MessageSquare className="h-6 w-6" />}
          color="blue"
        />

        <ReportCard
          title="Average Rating"
          value={`${report.average}/5`}
          icon={<Star className="h-6 w-6" />}
          color="yellow"
        />

        <ReportCard
          title="Verified"
          value={report.verified}
          icon={<ShieldCheck className="h-6 w-6" />}
          color="green"
        />

        <ReportCard
          title="Positive"
          value={report.positive}
          icon={<TrendingUp className="h-6 w-6" />}
          color="emerald"
        />

        <ReportCard
          title="Likes"
          value={report.likes}
          icon={<ThumbsUp className="h-6 w-6" />}
          color="indigo"
        />

      </div>

      {/* ======================================================= */}
      {/* REPORT SUMMARY */}
      {/* ======================================================= */}

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-6 py-4">

            <h2 className="flex items-center gap-2 text-lg font-semibold">

              <FileText className="h-5 w-5 text-blue-600" />

              Review Summary

            </h2>

          </div>

          <div className="space-y-4 p-6">

            <SummaryRow
              icon={<Globe className="h-4 w-4 text-green-600" />}
              label="Published Reviews"
              value={report.published}
            />

            <SummaryRow
              icon={<GlobeLock className="h-4 w-4 text-gray-500" />}
              label="Draft Reviews"
              value={report.draft}
            />

            <SummaryRow
              icon={<ShieldCheck className="h-4 w-4 text-blue-600" />}
              label="Verified Reviews"
              value={report.verified}
            />

            <SummaryRow
              icon={<ShieldOff className="h-4 w-4 text-red-500" />}
              label="Pending Reviews"
              value={report.pending}
            />

            <SummaryRow
              icon={<TrendingUp className="h-4 w-4 text-green-600" />}
              label="Positive Reviews"
              value={report.positive}
            />

            <SummaryRow
              icon={<TrendingDown className="h-4 w-4 text-red-500" />}
              label="Negative Reviews"
              value={report.negative}
            />

          </div>

        </div>

        {/* ======================================================= */}
        {/* TOP REVIEW */}
        {/* ======================================================= */}

        <div className="rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-6 py-4">

            <h2 className="flex items-center gap-2 text-lg font-semibold">

              <Star className="h-5 w-5 text-yellow-500" />

              Most Popular Review

            </h2>

          </div>

          <div className="p-6">

            {report.topReview ? (

              <>

                <h3 className="text-lg font-semibold text-gray-900">
                  {report.topReview.title || "Untitled Review"}
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  {report.topReview.comment}
                </p>

                <div className="mt-6 grid gap-3">

                  <InfoItem
                    label="Property"
                    value={
                      report.topReview.property?.title || "-"
                    }
                  />

                  <InfoItem
                    label="Customer"
                    value={
                      report.topReview.user?.name || "-"
                    }
                  />

                  <InfoItem
                    label="Rating"
                    value={`${report.topReview.rating}/5`}
                  />

                  <InfoItem
                    label="Likes"
                    value={report.topReview.likes_count || 0}
                  />

                </div>

              </>

            ) : (

              <div className="py-12 text-center">

                <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />

                <p className="mt-4 text-gray-500">
                  No reviews available.
                </p>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* ======================================================= */}
      {/* GENERATED REPORT */}
      {/* ======================================================= */}

      <div className="rounded-2xl border bg-white shadow-sm">

        <div className="border-b px-6 py-4">

          <h2 className="flex items-center gap-2 text-lg font-semibold">

            <Calendar className="h-5 w-5 text-blue-600" />

            Generated Report

          </h2>

        </div>

        <div className="space-y-4 p-6">

          <p className="text-gray-700">
            This report summarizes the current property review activities
            across the platform.
          </p>

          <ul className="list-disc space-y-2 pl-6 text-gray-700">

            <li>
              Total property reviews: <strong>{report.total}</strong>
            </li>

            <li>
              Average customer rating:
              <strong> {report.average}/5</strong>
            </li>

            <li>
              Published reviews:
              <strong> {report.published}</strong>
            </li>

            <li>
              Verified reviews:
              <strong> {report.verified}</strong>
            </li>

            <li>
              Positive feedback:
              <strong> {report.positive}</strong>
            </li>

            <li>
              Negative feedback:
              <strong> {report.negative}</strong>
            </li>

            <li>
              Total likes received:
              <strong> {report.likes}</strong>
            </li>

          </ul>

        </div>

      </div>

    </div>
  );
};

const ReportCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
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

const SummaryRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between rounded-xl border p-4">

    <div className="flex items-center gap-3">

      {icon}

      <span className="font-medium text-gray-700">
        {label}
      </span>

    </div>

    <span className="text-lg font-bold text-gray-900">
      {value}
    </span>

  </div>
);

const InfoItem = ({ label, value }) => (
  <div className="flex items-center justify-between border-b pb-3">

    <span className="text-sm text-gray-500">
      {label}
    </span>

    <span className="font-semibold text-gray-900">
      {value}
    </span>

  </div>
);

export default PropertyReviewReports;