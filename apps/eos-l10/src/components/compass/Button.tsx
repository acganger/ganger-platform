import { clsx } from "clsx";
import type React from "react";

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "outline" | "eos"
}) {
  return (
    <button
      type={type}
      className={clsx(
        className,
        "rounded-full px-3.5 py-2 text-sm/6 font-semibold focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 transition-colors",
        {
          "bg-gray-950 text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600": variant === "primary",
          "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600": variant === "secondary",
          "ring-1 ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-600 dark:text-gray-300 dark:hover:bg-gray-800": variant === "outline",
          "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:outline-blue-500": variant === "eos"
        }
      )}
      {...props}
    />
  );
}