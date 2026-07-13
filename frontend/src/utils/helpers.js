import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/*
|--------------------------------------------------------------------------
| 🎨 CLASSNAME MERGER (TAILWIND SAFE)
|--------------------------------------------------------------------------
| Prevents Tailwind class conflicts automatically
*/
export const cn = (...inputs) => twMerge(clsx(inputs));

/*
|--------------------------------------------------------------------------
| 🔗 SLUG GENERATOR (URL SAFE + ACCENT SAFE)
|--------------------------------------------------------------------------
*/
export const slugify = (text = "") => {
  if (typeof text !== "string") return "";

  return text
    .toString()
    .normalize("NFD") // remove accents
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

/*
|--------------------------------------------------------------------------
| ✍️ CAPITALIZE FIRST LETTER
|--------------------------------------------------------------------------
*/
export const capitalize = (text = "") => {
  if (typeof text !== "string") return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/*
|--------------------------------------------------------------------------
| 📦 SAFE ARRAY NORMALIZER
|--------------------------------------------------------------------------
*/
export const safeArray = (data) =>
  Array.isArray(data) ? data : [];

/*
|--------------------------------------------------------------------------
| 🧠 SAFE OBJECT NORMALIZER
|--------------------------------------------------------------------------
*/
export const safeObject = (data) =>
  data && typeof data === "object" && !Array.isArray(data)
    ? data
    : {};

/*
|--------------------------------------------------------------------------
| 🔐 EMPTY CHECKER (IMPROVED)
|--------------------------------------------------------------------------
*/
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;

  if (typeof value === "string") return value.trim().length === 0;

  if (Array.isArray(value)) return value.length === 0;

  if (typeof value === "object") return Object.keys(value).length === 0;

  return false;
};

/*
|--------------------------------------------------------------------------
| 🔢 SAFE NUMBER PARSER
|--------------------------------------------------------------------------
*/
export const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

/*
|--------------------------------------------------------------------------
| 🧾 TRUNCATE TEXT
|--------------------------------------------------------------------------
*/
export const truncate = (text = "", length = 100) => {
  if (typeof text !== "string") return "";
  return text.length > length
    ? text.slice(0, length) + "..."
    : text;
};

/*
|--------------------------------------------------------------------------
| 🆔 UNIQUE ID GENERATOR
|--------------------------------------------------------------------------
*/
export const uid = () => {
  return crypto?.randomUUID?.() || Date.now().toString();
};