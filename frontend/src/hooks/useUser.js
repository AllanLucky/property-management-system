import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../store/userSlice";

import { useMemo, useCallback } from "react";

/*
|--------------------------------------------------------------------------
| USERS HOOK (PRODUCTION SAFE + STABLE REFERENCES)
|--------------------------------------------------------------------------
*/
export default function useUsers() {
  const dispatch = useDispatch();

  const { users, user, loading, error } = useSelector(
    (state) => state.users
  );

  /*
  |--------------------------------------------------------------------------
  | ACTIONS (useCallback prevents re-renders + loops)
  |--------------------------------------------------------------------------
  */
  const getUsers = useCallback(() => {
    return dispatch(fetchUsers());
  }, [dispatch]);

  const addUser = useCallback(
    (data) => {
      return dispatch(createUser(data));
    },
    [dispatch]
  );

  const editUser = useCallback(
    (id, data) => {
      return dispatch(updateUser({ id, data }));
    },
    [dispatch]
  );

  const removeUser = useCallback(
    (id) => {
      return dispatch(deleteUser(id));
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | DERIVED STATE
  |--------------------------------------------------------------------------
  */
  const hasUsers = useMemo(
    () => Array.isArray(users) && users.length > 0,
    [users]
  );

  const totalUsers = useMemo(
    () => users?.length || 0,
    [users]
  );

  const isEmpty = useMemo(
    () => !users || users.length === 0,
    [users]
  );

  /*
  |--------------------------------------------------------------------------
  | HELPERS (memoized safe)
  |--------------------------------------------------------------------------
  */
  const findUserById = useCallback(
    (id) => users?.find((u) => u.id === Number(id)),
    [users]
  );

  const searchUsers = useCallback(
    (keyword = "") => {
      const lower = keyword.toLowerCase();

      return users?.filter((u) =>
        `${u.first_name} ${u.last_name} ${u.email}`
          .toLowerCase()
          .includes(lower)
      );
    },
    [users]
  );

  /*
  |--------------------------------------------------------------------------
  | RETURN API
  |--------------------------------------------------------------------------
  */
  return {
    // state
    users,
    user,
    loading,
    error,

    // actions
    getUsers,
    addUser,
    editUser,
    removeUser,

    // helpers
    findUserById,
    searchUsers,

    // derived
    hasUsers,
    isEmpty,
    totalUsers,
  };
}