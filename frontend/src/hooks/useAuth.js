import { useDispatch, useSelector } from "react-redux";
import { loginUser, logoutUser } from "../store/authSlice";

export default function useAuth() {
  const dispatch = useDispatch();

  const { user, token, loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  /*
  |--------------------------------------------------
  | LOGIN
  |--------------------------------------------------
  */
  const login = async (credentials) => {
    return dispatch(loginUser(credentials));
  };

  /*
  |--------------------------------------------------
  | LOGOUT
  |--------------------------------------------------
  */
  const logout = async () => {
    return dispatch(logoutUser());
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
  };
}