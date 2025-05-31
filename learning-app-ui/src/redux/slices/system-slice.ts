import { User, Notification, OptionState } from "@/config/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SystemState {
  profile: User | null;
  notifications: {
    data: Notification[] | null;
    total: number;
    page: number;
  };
  activeClasses: OptionState[] | null;
  activeStudents: OptionState[] | null;
  systemUsers: OptionState[] | null;
}

const initialState: SystemState = {
  profile: null,
  activeClasses: [],
  activeStudents: [],
  notifications: {
    data: [],
    total: 0,
    page: 1,
  },
  systemUsers: [],
};

export const systemSlice = createSlice({
  name: "system",
  initialState,
  reducers: {
    updateSystemInfo: (state, action: PayloadAction<Partial<SystemState>>) => {
      if (action.payload.profile !== undefined) {
        state.profile = action.payload.profile;
      }
      if (action.payload.activeClasses !== undefined) {
        state.activeClasses = action.payload.activeClasses;
      }
      if (action.payload.activeStudents !== undefined) {
        state.activeStudents = action.payload.activeStudents;
      }
      if (action.payload.notifications !== undefined) {
        state.notifications = action.payload.notifications;
      }
      if (action.payload.systemUsers !== undefined) {
        state.systemUsers = action.payload.systemUsers;
      }
    },
  },
});

export const { updateSystemInfo } = systemSlice.actions;

export const systemReducer = systemSlice.reducer;
