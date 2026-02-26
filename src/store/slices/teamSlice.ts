import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TeamMember } from '../../types';

interface TeamState {
    members: TeamMember[];
    selectedMember: TeamMember | null;
    loading: boolean;
}

const initialState: TeamState = {
    members: [],
    selectedMember: null,
    loading: false,
};

const teamSlice = createSlice({
    name: 'team',
    initialState,
    reducers: {
        setMembers: (state, action: PayloadAction<TeamMember[]>) => {
            state.members = action.payload;
        },
        setSelectedMember: (state, action: PayloadAction<TeamMember | null>) => {
            state.selectedMember = action.payload;
        },
        updateMemberStatus: (state, action: PayloadAction<{ id: string; status: TeamMember['status'] }>) => {
            const member = state.members.find((m) => m.id === action.payload.id);
            if (member) member.status = action.payload.status;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
    },
});

export const { setMembers, setSelectedMember, updateMemberStatus, setLoading } = teamSlice.actions;
export default teamSlice.reducer;
