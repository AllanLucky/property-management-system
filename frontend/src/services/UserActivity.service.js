import UserActivityAPI from "../api/UserActivity.api";

/*
|--------------------------------------------------------------------------
| USER ACTIVITY SERVICE (BUSINESS LOGIC LAYER)
|--------------------------------------------------------------------------
| This sits between UI and API
| Handles formatting, defaults, and reusable logic
*/
class UserActivityService {
    /*
    |----------------------------------------------------------------------
    | GET ALL ACTIVITIES (ADMIN)
    |----------------------------------------------------------------------
    */
    async fetchActivities(filters = {}) {
        try {
            const response = await UserActivityAPI.getAll(filters);

            return this.formatResponse(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /*
    |----------------------------------------------------------------------
    | GET SINGLE ACTIVITY
    |----------------------------------------------------------------------
    */
    async fetchActivity(id) {
        try {
            const response = await UserActivityAPI.getById(id);
            return this.formatResponse(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /*
    |----------------------------------------------------------------------
    | GET CURRENT USER ACTIVITY
    |----------------------------------------------------------------------
    */
    async fetchMyActivities(params = {}) {
        try {
            const response = await UserActivityAPI.getMyActivities(params);
            return this.formatResponse(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /*
    |----------------------------------------------------------------------
    | CREATE ACTIVITY (ADMIN TOOL)
    |----------------------------------------------------------------------
    */
    async createActivity(payload) {
        try {
            const response = await UserActivityAPI.create(payload);
            return this.formatResponse(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /*
    |----------------------------------------------------------------------
    | DELETE ACTIVITY
    |----------------------------------------------------------------------
    */
    async deleteActivity(id) {
        try {
            const response = await UserActivityAPI.delete(id);
            return this.formatResponse(response);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /*
    |----------------------------------------------------------------------
    | FORMAT RESPONSE (UNIFORM STRUCTURE)
    |----------------------------------------------------------------------
    */
    formatResponse(response) {
        return {
            success: response?.status ?? true,
            message: response?.message ?? "Success",
            data: response?.data ?? null,
            meta: response?.meta ?? null,
            pagination: response?.meta ?? response?.data?.pagination ?? null,
        };
    }

    /*
    |----------------------------------------------------------------------
    | ERROR HANDLER
    |----------------------------------------------------------------------
    */
    handleError(error) {
        const message =
            error?.response?.data?.message ||
            error?.message ||
            "Something went wrong";

        return {
            success: false,
            message,
            errors: error?.response?.data?.errors || null,
        };
    }

    /*
    |----------------------------------------------------------------------
    | HELPER: FORMAT ACTIVITY LABELS
    |----------------------------------------------------------------------
    */
    formatActivityLabel(activity) {
        if (!activity) return null;

        return {
            ...activity,
            action_label: this.humanize(activity.action),
            type_label: this.humanize(activity.type),
        };
    }

    /*
    |----------------------------------------------------------------------
    | HELPER: HUMANIZE STRINGS
    |----------------------------------------------------------------------
    */
    humanize(str) {
        if (!str) return "";
        return str
            .replace(/_/g, " ")
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
    }
}

export default new UserActivityService();