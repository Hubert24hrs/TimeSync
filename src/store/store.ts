import { combineReducers, configureStore, type Reducer } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import type { PersistPartial } from 'redux-persist/es/persistReducer';
import adsReducer from './slices/adsSlice';
import aiReducer from './slices/aiSlice';
import authReducer from './slices/authSlice';
import referralReducer from './slices/referralSlice';
import settingsReducer from './slices/settingsSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import workspaceReducer from './slices/workspaceSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    settings: settingsReducer,
    workspace: workspaceReducer,
    ai: aiReducer,
    subscription: subscriptionReducer,
    ads: adsReducer,
    referral: referralReducer,
});

// Everything is cached on-device for offline use; React Query refreshes cloud data on top.
const persistConfig = { key: 'timesync-v2', version: 2, storage: AsyncStorage };

type State = ReturnType<typeof rootReducer>;
// Explicit generics: redux-persist's typings otherwise widen the store state to `any` with Redux 5.
const persisted = persistReducer<State>(persistConfig, rootReducer as unknown as Reducer<State>) as unknown as Reducer<State & PersistPartial>;

export const store = configureStore({
    reducer: persisted,
    middleware: (getDefault) => getDefault({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
