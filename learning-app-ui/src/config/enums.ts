export enum Role {
  ADMIN = "ADMIN",
  TA = "TA",
  GUEST = "GUEST",
}

export enum Permission {
  CREATE_USER = "CREATE_USER",
  CREATE_STUDENT = "CREATE_STUDENT",
  CREATE_CLASS = "CREATE_CLASS",
  CREATE_ATTENDANCE = "CREATE_ATTENDANCE",
  CREATE_PAYMENT = "CREATE_PAYMENT",
}

export enum SessionKey {
  SESSION_1 = "SESSION_1",
  SESSION_2 = "SESSION_2",
  SESSION_3 = "SESSION_3",
  SESSION_4 = "SESSION_4",
  SESSION_5 = "SESSION_5",
  SESSION_6 = "SESSION_6",
  SESSION_7 = "SESSION_7",
}

export enum Status {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum SortType {
  ASC = "asc",
  DESC = "desc",
}

export enum PaymentStatus {
  SAVED = "SAVED",
  SENT = "SENT",
  PAYING = "PAYING",
  DONE = "DONE",
}
