import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AlertState } from "@/config/types";

const initialState: AlertState = {
  isOpen: false,
  title: "",
  subtitle: "",
  type: "success",
};

export const alertSlice = createSlice({
  name: "alert",
  initialState,
  reducers: {
    closeAlert: (state) => {
      state.isOpen = false;
    },
    openAlert: (state, action: PayloadAction<AlertState>) => {
      state.isOpen = true;
      state.title = action.payload.title;
      state.subtitle = action.payload.subtitle;
      state.type = action.payload.type;
    },
  },
});

export const { closeAlert, openAlert } = alertSlice.actions;

export const alertReducer = alertSlice.reducer;
