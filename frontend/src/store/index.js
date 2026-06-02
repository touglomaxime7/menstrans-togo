import { configureStore } from '@reduxjs/toolkit';
import authReducer    from './authSlice';
import dossierReducer from './dossierSlice';

export default configureStore({
  reducer: {
    auth:    authReducer,
    dossier: dossierReducer,
  },
});