import { format, isValid } from "date-fns";

/*
|--------------------------------------------------------------------------
| 🧠 SAFE DATE PARSER
|--------------------------------------------------------------------------
*/
const safeDate = (date) => {
  if (!date) return null;

  const parsed = new Date(date);
  return isValid(parsed) ? parsed : null;
};

/*
|--------------------------------------------------------------------------
| 📅 FORMAT DATE
|--------------------------------------------------------------------------
*/
export const formatDate = (date, formatType = "dd MMM yyyy") => {
  const parsed = safeDate(date);

  if (!parsed) return "-";

  return format(parsed, formatType);
};

/*
|--------------------------------------------------------------------------
| 🕒 FORMAT DATE TIME
|--------------------------------------------------------------------------
*/
export const formatDateTime = (date) => {
  return formatDate(date, "dd MMM yyyy, hh:mm a");
};

/*
|--------------------------------------------------------------------------
| ⏱️ ISO FORMAT (API FRIENDLY)
|--------------------------------------------------------------------------
*/
export const toISODate = (date) => {
  const parsed = safeDate(date);
  return parsed ? parsed.toISOString() : null;
};

/*
|--------------------------------------------------------------------------
| 🧾 SHORT DATE (UI CARDS)
|--------------------------------------------------------------------------
*/
export const formatShortDate = (date) => {
  return formatDate(date, "dd/MM/yyyy");
};

/*
|--------------------------------------------------------------------------
| 🕓 TIME ONLY
|--------------------------------------------------------------------------
*/
export const formatTime = (date) => {
  return formatDate(date, "hh:mm a");
};