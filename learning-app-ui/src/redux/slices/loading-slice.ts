import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: false,
};

export const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    closeLoading: (state) => {
      state.isOpen = false;
    },
    openLoading: (state) => {
      state.isOpen = true;
    },
  },
});

// Action creators are generated for each case reducer function
export const { closeLoading, openLoading } = loadingSlice.actions;

export const loadingReducer = loadingSlice.reducer;
