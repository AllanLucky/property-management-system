import api from "./axios";

/*
|--------------------------------------------------------------------------
| API Endpoints
|--------------------------------------------------------------------------
*/

const ADMIN_BASE_URL = "/property-reviews";
const REVIEW_BASE_URL = "/reviews";

/*
|--------------------------------------------------------------------------
| Super Admin & Admin Property Review APIs
|--------------------------------------------------------------------------
*/

/**
 * Get all property reviews
 */
export const getPropertyReviews = async (params = {}) =>
    api.get(ADMIN_BASE_URL, { params });

/**
 * Get single property review
 */
export const getPropertyReview = async (id) =>
    api.get(`${ADMIN_BASE_URL}/${id}`);

/**
 * Update property review
 */
export const updatePropertyReview = async (id, data) =>
    api.put(`${ADMIN_BASE_URL}/${id}`, data);

/**
 * Partial update property review
 */
export const patchPropertyReview = async (id, data) =>
    api.patch(`${ADMIN_BASE_URL}/${id}`, data);

/**
 * Delete property review
 */
export const deletePropertyReview = async (id) =>
    api.delete(`${ADMIN_BASE_URL}/${id}`);

/*
|--------------------------------------------------------------------------
| Publish Management
|--------------------------------------------------------------------------
*/

/**
 * Publish review
 */
export const publishPropertyReview = async (id) =>
    api.patch(`${ADMIN_BASE_URL}/${id}/publish`);

/**
 * Unpublish review
 */
export const unpublishPropertyReview = async (id) =>
    api.patch(`${ADMIN_BASE_URL}/${id}/unpublish`);

/**
 * Toggle publish status
 */
export const togglePublishPropertyReview = async (id) =>
    api.patch(`${ADMIN_BASE_URL}/${id}/toggle-publish`);

/*
|--------------------------------------------------------------------------
| Verification Management
|--------------------------------------------------------------------------
*/

/**
 * Verify review
 */
export const verifyPropertyReview = async (id) =>
    api.patch(`${ADMIN_BASE_URL}/${id}/verify`);

/**
 * Unverify review
 */
export const unverifyPropertyReview = async (id) =>
    api.patch(`${ADMIN_BASE_URL}/${id}/unverify`);

/**
 * Toggle verification status
 */
export const toggleVerificationPropertyReview = async (id) =>
    api.patch(`${ADMIN_BASE_URL}/${id}/toggle-verification`);

/*
|--------------------------------------------------------------------------
| Like Management
|--------------------------------------------------------------------------
*/

/**
 * Like review
 */
export const likePropertyReview = async (id) =>
    api.post(`${ADMIN_BASE_URL}/${id}/like`);

/**
 * Unlike review
 */
export const unlikePropertyReview = async (id) =>
    api.delete(`${ADMIN_BASE_URL}/${id}/like`);

/*
|--------------------------------------------------------------------------
| Customer / Tenant Property Review APIs
|--------------------------------------------------------------------------
*/

/**
 * Create property review
 */
export const createPropertyReview = async (data) =>
    api.post(REVIEW_BASE_URL, data);

/**
 * Get public property reviews
 */
export const getReviews = async (params = {}) =>
    api.get(REVIEW_BASE_URL, { params });

/**
 * Get logged-in user's review
 */
export const getMyPropertyReview = async () =>
    api.get(`${REVIEW_BASE_URL}/my-review`);

/**
 * Get property review summary
 */
export const getPropertyReviewSummary = async (params = {}) =>
    api.get(`${REVIEW_BASE_URL}/summary`, { params });

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

const PropertyReviewApi = {
    // Admin & Super Admin
    getPropertyReviews,
    getPropertyReview,
    updatePropertyReview,
    patchPropertyReview,
    deletePropertyReview,

    publishPropertyReview,
    unpublishPropertyReview,
    togglePublishPropertyReview,

    verifyPropertyReview,
    unverifyPropertyReview,
    toggleVerificationPropertyReview,

    likePropertyReview,
    unlikePropertyReview,

    // Customer
    createPropertyReview,
    getReviews,
    getMyPropertyReview,
    getPropertyReviewSummary,
};

export default PropertyReviewApi;