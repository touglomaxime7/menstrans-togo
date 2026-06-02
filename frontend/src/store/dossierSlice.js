import { createSlice } from '@reduxjs/toolkit';

const dossierSlice = createSlice({
  name: 'dossier',
  initialState: {
    dossiers:  [],
    stats:     null,
    loading:   false,
    error:     null,
  },
  reducers: {
    setDossiers: (state, action) => {
      state.dossiers = action.payload;
      state.loading  = false;
    },
    setStats: (state, action) => {
      state.stats   = action.payload;
      state.loading = false;
    },
    setLoading: (state) => {
      state.loading = true;
      state.error   = null;
    },
    setError: (state, action) => {
      state.error   = action.payload;
      state.loading = false;
    },
  },
});

export const { setDossiers, setStats, setLoading, setError } = dossierSlice.actions;
export default dossierSlice.reducer;