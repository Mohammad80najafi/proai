export type AuthField =
  | "displayName"
  | "username"
  | "email"
  | "password"
  | "confirmPassword";

export type AuthFieldErrors = Partial<Record<AuthField, string[]>>;

export type AuthFormValues = Partial<
  Record<"displayName" | "username" | "email", string>
>;

export type AuthActionState = {
  status: "idle" | "error";
  message?: string;
  errors?: AuthFieldErrors;
  values?: AuthFormValues;
};

export const INITIAL_AUTH_ACTION_STATE: AuthActionState = { status: "idle" };

