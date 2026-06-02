import { createSlice } from '@reduxjs/toolkit';
import { getUtilisateur } from '../api/auth';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    utilisateur: getUtilisateur(),
    isAuthenticated: !!localStorage.getItem('access_token'),
  },
  reducers: {
    setAuth: (state, action) => {
      state.utilisateur     = action.payload.utilisateur;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.utilisateur     = null;
      state.isAuthenticated = false;
      localStorage.clear();
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;