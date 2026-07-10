import { z } from "zod";

const reservedUsernames = new Set([
  "admin",
  "api",
  "explore",
  "login",
  "messages",
  "notifications",
  "proai",
  "register",
  "settings",
  "skills",
  "support",
]);

const emailSchema = z
  .string()
  .trim()
  .min(1, { error: "ایمیل را وارد کنید." })
  .max(254, { error: "ایمیل بیش از حد طولانی است." })
  .email({ error: "یک ایمیل معتبر وارد کنید." })
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(1, { error: "رمز عبور را وارد کنید." })
  .min(8, { error: "رمز عبور باید حداقل ۸ نویسه باشد." })
  .refine((value) => /\p{L}/u.test(value), {
    error: "رمز عبور باید دست‌کم یک حرف داشته باشد.",
  })
  .refine((value) => /\p{N}/u.test(value), {
    error: "رمز عبور باید دست‌کم یک عدد داشته باشد.",
  })
  .refine((value) => new TextEncoder().encode(value).length <= 72, {
    error: "رمز عبور نباید بیش از ۷۲ بایت باشد.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "رمز عبور را وارد کنید." }),
  redirectTo: z.string().max(2_048).optional(),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, { error: "نام نمایشی باید حداقل ۲ نویسه باشد." })
      .max(60, { error: "نام نمایشی نباید بیش از ۶۰ نویسه باشد." }),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, { error: "نام کاربری باید حداقل ۳ نویسه باشد." })
      .max(30, { error: "نام کاربری نباید بیش از ۳۰ نویسه باشد." })
      .regex(/^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$/, {
        error: "فقط حروف انگلیسی کوچک، عدد، خط تیره و زیرخط مجاز است.",
      })
      .refine((value) => !reservedUsernames.has(value), {
        error: "این نام کاربری رزرو شده است.",
      }),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, { error: "تکرار رمز عبور را وارد کنید." }),
    redirectTo: z.string().max(2_048).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "تکرار رمز عبور با رمز عبور یکسان نیست.",
    path: ["confirmPassword"],
  });

