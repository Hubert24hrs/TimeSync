import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import calendarReducer from './slices/calendarSlice';
import teamReducer from './slices/teamSlice';
import energyReducer from './slices/energySlice';
import settingsReducer from './slices/settingsSlice';
import aiReducer from './slices/aiSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    calendar: calendarReducer,
    team: teamReducer,
    energy: energyReducer,
    settings: settingsReducer,
    ai: aiReducer,
});

const persistConfig = {
    key: 'timesync-root',
    storage: AsyncStorage,
    whitelist: ['auth', 'settings'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
