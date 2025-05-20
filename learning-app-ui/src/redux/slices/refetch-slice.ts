import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RefetchState } from "@/config/types";

const initialState: RefetchState = {
  count: 0,
};

export const refetchSlice = createSlice({
  name: "refetch",
  initialState,
  reducers: {
    refetch: (state) => {
      state.count += 1;
    },
  },
});

export const { refetch } = refetchSlice.actions;

export const refetchReducer = refetchSlice.reducer;
