import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage, ScheduleSuggestion, ChronotypeResult } from '../../types';

interface AIState {
    chatMessages: ChatMessage[];
    isThinking: boolean;
    suggestions: ScheduleSuggestion[];
    chronotypeResult: ChronotypeResult | null;
}

const initialState: AIState = {
    chatMessages: [],
    isThinking: false,
    suggestions: [],
    chronotypeResult: null,
};

const aiSlice = createSlice({
    name: 'ai',
    initialState,
    reducers: {
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            state.chatMessages.push(action.payload);
        },
        setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
            state.chatMessages = action.payload;
        },
        setIsThinking: (state, action: PayloadAction<boolean>) => {
            state.isThinking = action.payload;
        },
        setSuggestions: (state, action: PayloadAction<ScheduleSuggestion[]>) => {
            state.suggestions = action.payload;
        },
        setChronotypeResult: (state, action: PayloadAction<ChronotypeResult>) => {
            state.chronotypeResult = action.payload;
        },
    },
});

export const { addMessage, setMessages, setIsThinking, setSuggestions, setChronotypeResult } = aiSlice.actions;
export default aiSlice.reducer;
