import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { modalReducer } from "./slices/modal-slice";
import { drawerReducer } from "./slices/drawer-slice";
import { confirmReducer } from "./slices/confirm-slice";
import { loadingReducer } from "./slices/loading-slice";
import { alertReducer } from "./slices/alert-slice";
import { refetchReducer } from "./slices/refetch-slice";
import { systemReducer } from "./slices/system-slice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["system"], // only system will be persisted
  blacklist: ["confirm", "modal", "drawer", "loading", "alert", "refetch"], // explicitly blacklist slices with non-serializable values
};

const rootReducer = combineReducers({
  modal: modalReducer,
  drawer: drawerReducer,
  confirm: confirmReducer,
  loading: loadingReducer,
  alert: alertReducer,
  refetch: refetchReducer,
  system: systemReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
          "confirm/openConfirm",
          "modal/openModal",
          "drawer/openDrawer",
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload.handleAction", "payload.content"],
        // Ignore these paths in the state
        ignoredPaths: ["confirm.handleAction", "modal.content", "drawer.content"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
