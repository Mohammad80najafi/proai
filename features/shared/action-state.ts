export type ActionState<TFields extends string = string, TData = undefined> = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<TFields, string[]>>;
  data?: TData;
};

export const idleActionState: ActionState = { status: "idle" };

export function errorActionState(message: string): ActionState {
  return { status: "error", message };
}
