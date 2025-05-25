import { MouseEventHandler } from "react";
import { Status, SessionKey } from "./enums";

export type ModalState = {
  isOpen?: boolean;
  title: string;
  content: React.ReactNode;
  className?: string;
};

export interface ConfirmState {
  isOpen: boolean;
  title: string;
  subtitle: string;
  titleAction: string;
  handleAction: MouseEventHandler<Element>;
}

export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertState {
  isOpen: boolean;
  title: string;
  subtitle: string;
  type: AlertType;
}

export interface RefetchState {
  count: number;
}

export interface Attendance {
  id: number;
  isAttend: boolean;
  noteAttendance: string;
  createdAt: string;
  updatedAt: string;
  studentId: number;
  sessionId: number;
  paymentId: number;
  createdById: number;
  updatedById: number | null;
}

export interface Session {
  id: number;
  sessionKey: SessionKey;
  startTime: string;
  endTime: string;
  amount: number;
  status: Status;
  hasAttendance?: boolean;
  createdAt: string;
  updatedAt: string;
  classId: number;
  attendances: Attendance[];
}

export interface Class {
  id: number;
  name: string;
  description: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  sessions: Session[];
}

export interface StudentClass {
  id: number;
  studentId: number;
  classId: number;
  status: Status;
  createdAt: string;
  updatedAt: string;
  class: Class;
}

export interface Student {
  id: number;
  name: string;
  dob: string;
  parent: string;
  phoneNumber: string;
  secondPhoneNumber: string | null;
  debt: number;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  updatedById: number | null;
  classes: StudentClass[];
  status: Status;
}

export interface Message {
  id: number;
  content: string;
  sender: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassesResponse {
  total: number;
  data: Class[];
}
