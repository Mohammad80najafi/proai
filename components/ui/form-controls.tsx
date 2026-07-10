import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "./cn";

interface FieldMetaProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
}

function FieldMeta({
  id,
  label,
  hint,
  error,
  children,
  className,
}: FieldMetaProps & {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const descriptionId = hint || error ? `${id}-description` : undefined;

  return (
    <label className={cn("grid gap-2", className)} htmlFor={id}>
      {label ? (
        <span className="text-sm font-medium text-slate-200">{label}</span>
      ) : null}
      {children}
      {hint || error ? (
        <span
          id={descriptionId}
          className={cn(
            "text-xs leading-5",
            error ? "text-red-300" : "text-slate-500",
          )}
        >
          {error || hint}
        </span>
      ) : null}
    </label>
  );
}

const controlStyles =
  "w-full rounded-xl border border-white/[0.09] bg-[#090e18] text-sm text-slate-100 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-600 hover:border-white/[0.14] focus:border-indigo-400/55 focus:bg-[#0b111d] focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    FieldMetaProps {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    containerClassName,
    label,
    hint,
    error,
    startIcon,
    endIcon,
    id,
    name,
    dir = "auto",
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? name ?? generatedId;
  const descriptionId = hint || error ? `${inputId}-description` : undefined;

  return (
    <FieldMeta
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <span className="relative block">
        {startIcon ? (
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-slate-500 [&>svg]:size-4">
            {startIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          name={name}
          dir={dir}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
          className={cn(
            controlStyles,
            "h-11 px-3.5",
            startIcon && "ps-10",
            endIcon && "pe-10",
            error && "border-red-400/50 focus:border-red-400 focus:ring-red-500/10",
            className,
          )}
          {...props}
        />
        {endIcon ? (
          <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-slate-500 [&>svg]:size-4">
            {endIcon}
          </span>
        ) : null}
      </span>
    </FieldMeta>
  );
});

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    FieldMetaProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      className,
      containerClassName,
      label,
      hint,
      error,
      id,
      name,
      dir = "auto",
      rows = 5,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? name ?? generatedId;
    const descriptionId = hint || error ? `${inputId}-description` : undefined;

    return (
      <FieldMeta
        id={inputId}
        label={label}
        hint={hint}
        error={error}
        className={containerClassName}
      >
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          dir={dir}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
          className={cn(
            controlStyles,
            "min-h-28 resize-y px-3.5 py-3 leading-7",
            error && "border-red-400/50 focus:border-red-400 focus:ring-red-500/10",
            className,
          )}
          {...props}
        />
      </FieldMeta>
    );
  },
);

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>,
    FieldMetaProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    className,
    containerClassName,
    label,
    hint,
    error,
    id,
    name,
    children,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? name ?? generatedId;
  const descriptionId = hint || error ? `${inputId}-description` : undefined;

  return (
    <FieldMeta
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <span className="relative block">
        <select
          ref={ref}
          id={inputId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
          className={cn(
            controlStyles,
            "h-11 appearance-none px-3.5 pe-10",
            error && "border-red-400/50 focus:border-red-400 focus:ring-red-500/10",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-slate-500"
          aria-hidden="true"
        />
      </span>
    </FieldMeta>
  );
});
