export type AuthField = "phoneNumber" | "code" | "displayName" | "username";

export type AuthFieldErrors = Partial<Record<AuthField, string[]>>;

export type AuthPhase = "phone" | "code" | "profile";

export type AuthFormValues = Partial<
  Record<"phoneNumber" | "displayName" | "username", string>
>;

export type AuthActionState = {
  status: "idle" | "error" | "success";
  phase: AuthPhase;
  message?: string;
  errors?: AuthFieldErrors;
  values?: AuthFormValues;
  challengeId?: string;
  maskedPhoneNumber?: string;
  developmentCode?: string;
};

export const INITIAL_AUTH_ACTION_STATE: AuthActionState = {
  status: "idle",
  phase: "phone",
};
