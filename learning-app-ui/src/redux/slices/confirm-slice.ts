import { ConfirmState } from "@/config/types";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: ConfirmState = {
  isOpen: false,
  title: "Confirm title",
  subtitle: "Sub title",
  titleAction: "",
  handleAction: () => {},
};

export const confirmSlice = createSlice({
  name: "confirm",
  initialState,
  reducers: {
    closeConfirm: (state) => {
      state.isOpen = false;
    },
    openConfirm: (state, action: PayloadAction<ConfirmState>) => {
      state.isOpen = true;
      state.title = action.payload.title;
      state.subtitle = action.payload.subtitle;
      state.titleAction = action.payload.titleAction;
      state.handleAction = action.payload.handleAction;
    },
  },
});

export const { closeConfirm, openConfirm } = confirmSlice.actions;

export const confirmReducer = confirmSlice.reducer;
