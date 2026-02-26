import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EnergyForecast } from '../../types';

interface EnergyState {
    currentLevel: number;
    forecast: EnergyForecast[];
    weeklyPattern: number[];
    burnoutRisk: number;
    loading: boolean;
}

const initialState: EnergyState = {
    currentLevel: 7,
    forecast: [],
    weeklyPattern: [6, 7, 8, 7, 6, 5, 7],
    burnoutRisk: 0.2,
    loading: false,
};

const energySlice = createSlice({
    name: 'energy',
    initialState,
    reducers: {
        setCurrentLevel: (state, action: PayloadAction<number>) => {
            state.currentLevel = action.payload;
        },
        setForecast: (state, action: PayloadAction<EnergyForecast[]>) => {
            state.forecast = action.payload;
        },
        setWeeklyPattern: (state, action: PayloadAction<number[]>) => {
            state.weeklyPattern = action.payload;
        },
        setBurnoutRisk: (state, action: PayloadAction<number>) => {
            state.burnoutRisk = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
    },
});

export const { setCurrentLevel, setForecast, setWeeklyPattern, setBurnoutRisk, setLoading } = energySlice.actions;
export default energySlice.reducer;
