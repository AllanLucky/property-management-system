import PropertyReviewApi from "../api/propertyReview.api";

class PropertyReviewService {
    /*
    |--------------------------------------------------------------------------
    | Admin & Super Admin
    |--------------------------------------------------------------------------
    */

    async getAll(params = {}) {
        const { data } = await PropertyReviewApi.getPropertyReviews(params);
        return data;
    }

    async getById(id) {
        const { data } = await PropertyReviewApi.getPropertyReview(id);
        return data;
    }

    async update(id, payload) {
        const { data } = await PropertyReviewApi.updatePropertyReview(
            id,
            payload
        );

        return data;
    }

    async patch(id, payload) {
        const { data } = await PropertyReviewApi.patchPropertyReview(
            id,
            payload
        );

        return data;
    }

    async delete(id) {
        const { data } = await PropertyReviewApi.deletePropertyReview(id);
        return data;
    }

    /*
    |--------------------------------------------------------------------------
    | Publish
    |--------------------------------------------------------------------------
    */

    async publish(id) {
        const { data } = await PropertyReviewApi.publishPropertyReview(id);
        return data;
    }

    async unpublish(id) {
        const { data } = await PropertyReviewApi.unpublishPropertyReview(id);
        return data;
    }

    async togglePublish(id) {
        const { data } =
            await PropertyReviewApi.togglePublishPropertyReview(id);

        return data;
    }

    /*
    |--------------------------------------------------------------------------
    | Verification
    |--------------------------------------------------------------------------
    */

    async verify(id) {
        const { data } = await PropertyReviewApi.verifyPropertyReview(id);
        return data;
    }

    async unverify(id) {
        const { data } = await PropertyReviewApi.unverifyPropertyReview(id);
        return data;
    }

    async toggleVerification(id) {
        const { data } =
            await PropertyReviewApi.toggleVerificationPropertyReview(id);

        return data;
    }

    /*
    |--------------------------------------------------------------------------
    | Likes
    |--------------------------------------------------------------------------
    */

    async like(id) {
        const { data } = await PropertyReviewApi.likePropertyReview(id);
        return data;
    }

    async unlike(id) {
        const { data } = await PropertyReviewApi.unlikePropertyReview(id);
        return data;
    }

    /*
    |--------------------------------------------------------------------------
    | Customer
    |--------------------------------------------------------------------------
    */

    async create(payload) {
        const { data } = await PropertyReviewApi.createPropertyReview(payload);
        return data;
    }

    async getReviews(params = {}) {
        const { data } = await PropertyReviewApi.getReviews(params);
        return data;
    }

    async getMyReview() {
        const { data } = await PropertyReviewApi.getMyPropertyReview();
        return data;
    }

    async getSummary(params = {}) {
        const { data } = await PropertyReviewApi.getPropertyReviewSummary(
            params
        );

        return data;
    }
}

export default new PropertyReviewService();