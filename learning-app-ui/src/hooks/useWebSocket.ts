"use client";
import { useEffect } from "react";
import { initializeWebSocket } from "@/websocket/websocket-client";
import { NEW_NOTIFICATION } from "@/config/constants";
import { Notification } from "@/config/types";
import { useDispatch, useSelector } from "react-redux";
import { openAlert } from "@/redux/slices/alert-slice";
import { RootState } from "@/redux/store";
import { updateSystemInfo } from "@/redux/slices/system-slice";

export const useWebSocket = (userId: number | null | undefined) => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state: RootState) => state.system);

  useEffect(() => {
    if (!userId) {
      dispatch(
        openAlert({
          isOpen: true,
          title: "ERROR",
          subtitle: "User not found. Please try again later.",
          type: "error",
        }),
      );
      return;
    }

    const wsClient = initializeWebSocket("http://localhost:3010/notifications");

    wsClient.connect();

    // Listen for connect event
    wsClient.on("connect", () => {
      wsClient.emit("join", userId);
    });

    // Listen for notifications
    wsClient.on(NEW_NOTIFICATION, (payload: unknown) => {
      const notification = payload as Notification;
      // Open alert
      dispatch(
        openAlert({
          isOpen: true,
          title: "New notification",
          subtitle: `You've got a new notification from ${notification.createdBy.fullname}`,
          type: "info",
        }),
      );
      // Update notifications in redux store
      const currentNotifications = notifications.data || [];
      dispatch(
        updateSystemInfo({
          notifications: {
            data: [notification, ...currentNotifications],
            total: notifications.total + 1,
            page: notifications.page,
          },
        }),
      );
    });

    return () => {
      wsClient.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
};
