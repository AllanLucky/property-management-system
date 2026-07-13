import { useState, useCallback } from "react";
import {
    getPropertyReviews,
    getPropertyReview,
    createPropertyReview,
    updatePropertyReview,
    deletePropertyReview,
    publishPropertyReview,
    unpublishPropertyReview,
    verifyPropertyReview,
    unverifyPropertyReview,
    togglePublishPropertyReview,
    toggleVerificationPropertyReview,
    likePropertyReview,
    unlikePropertyReview,
    getReviews,
    getMyPropertyReview,
    getPropertyReviewSummary,
} from "../api/PropertyReview.api";

const usePropertyReview = () => {
    const [reviews, setReviews] = useState([]);
    const [review, setReview] = useState(null);
    const [summary, setSummary] = useState(null);

    const [meta, setMeta] = useState({});
    const [links, setLinks] = useState({});

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    /*
    |--------------------------------------------------------------------------
    | Fetch Admin Reviews
    |--------------------------------------------------------------------------
    */
    const fetchReviews = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);

            const response = await getPropertyReviews(params);

            setReviews(response.data?.data || []);
            setMeta(response.data?.meta || {});
            setLinks(response.data?.links || {});
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data ||
                err.message
            );
        } finally {
            setLoading(false);
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Fetch Public Reviews
    |--------------------------------------------------------------------------
    */
    const fetchPublicReviews = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);

            const response = await getReviews(params);

            setReviews(response.data?.data || []);
            setMeta(response.data?.meta || {});
            setLinks(response.data?.links || {});
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data ||
                err.message
            );
        } finally {
            setLoading(false);
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Fetch Single Review
    |--------------------------------------------------------------------------
    */
    const fetchReview = useCallback(async (id) => {
        try {
            setLoading(true);
            setError(null);

            const response = await getPropertyReview(id);

            setReview(response.data?.data || null);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data ||
                err.message
            );
        } finally {
            setLoading(false);
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Create Review
    |--------------------------------------------------------------------------
    */
    const create = async (payload) => {
        try {
            setSaving(true);
            setError(null);

            const response = await createPropertyReview(payload);

            return response.data;
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data ||
                err.message
            );
            throw err;
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Update Review
    |--------------------------------------------------------------------------
    */
    const update = async (id, payload) => {
        try {
            setSaving(true);
            setError(null);

            const response = await updatePropertyReview(id, payload);

            return response.data;
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data ||
                err.message
            );
            throw err;
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Delete Review
    |--------------------------------------------------------------------------
    */
    const remove = async (id) => {
        try {
            setSaving(true);
            setError(null);

            await deletePropertyReview(id);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data ||
                err.message
            );
            throw err;
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Publish
    |--------------------------------------------------------------------------
    */
    const publish = async (id) => {
        await publishPropertyReview(id);
    };

    const unpublish = async (id) => {
        await unpublishPropertyReview(id);
    };

    const togglePublish = async (id) => {
        await togglePublishPropertyReview(id);
    };

    /*
    |--------------------------------------------------------------------------
    | Verification
    |--------------------------------------------------------------------------
    */
    const verify = async (id) => {
        await verifyPropertyReview(id);
    };

    const unverify = async (id) => {
        await unverifyPropertyReview(id);
    };

    const toggleVerification = async (id) => {
        await toggleVerificationPropertyReview(id);
    };

    /*
    |--------------------------------------------------------------------------
    | Likes
    |--------------------------------------------------------------------------
    */
    const like = async (id) => {
        await likePropertyReview(id);
    };

    const unlike = async (id) => {
        await unlikePropertyReview(id);
    };

    /*
    |--------------------------------------------------------------------------
    | My Review
    |--------------------------------------------------------------------------
    */
    const fetchMyReview = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getMyPropertyReview();

            setReview(response.data?.data || null);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data ||
                err.message
            );
        } finally {
            setLoading(false);
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Review Summary
    |--------------------------------------------------------------------------
    */
    const fetchSummary = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError(null);

            const response = await getPropertyReviewSummary(params);

            setSummary(response.data?.data || null);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data ||
                err.message
            );
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        reviews,
        review,
        summary,
        meta,
        links,

        loading,
        saving,
        error,

        fetchReviews,
        fetchPublicReviews,
        fetchReview,
        fetchSummary,
        fetchMyReview,

        create,
        update,
        remove,

        publish,
        unpublish,
        togglePublish,

        verify,
        unverify,
        toggleVerification,

        like,
        unlike,
    };
};

export default usePropertyReview;