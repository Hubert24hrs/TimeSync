import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '../../types';

interface AIState {
    chatMessages: ChatMessage[];
    isThinking: boolean;
}

const initialState: AIState = { chatMessages: [], isThinking: false };

const aiSlice = createSlice({
    name: 'ai',
    initialState,
    reducers: {
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            state.chatMessages.push(action.payload);
        },
        clearChat: (state) => {
            state.chatMessages = [];
        },
        setIsThinking: (state, action: PayloadAction<boolean>) => {
            state.isThinking = action.payload;
        },
    },
});

export const { addMessage, clearChat, setIsThinking } = aiSlice.actions;
export default aiSlice.reducer;
