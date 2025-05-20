import { ModalState } from "@/config/types";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: ModalState = {
  isOpen: false,
  title: "Drawer title",
  content: "",
};

export const drawerSlice = createSlice({
  name: "drawer",
  initialState,
  reducers: {
    closeDrawer: (state) => {
      state.isOpen = false;
      state.title = "";
      state.content = "";
    },
    openDrawer: (state, action: PayloadAction<ModalState>) => {
      state.isOpen = true;
      state.title = action.payload.title;
      state.content = action.payload.content;
    },
  },
});

// Action creators are generated for each case reducer function
export const { openDrawer, closeDrawer } = drawerSlice.actions;

export const drawerReducer = drawerSlice.reducer;
