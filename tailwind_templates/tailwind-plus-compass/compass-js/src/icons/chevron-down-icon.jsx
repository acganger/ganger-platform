import clsx from "clsx";

export function ChevronDownIcon({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 8 4"
      fill="none"
      className={clsx(className, "h-1 shrink-0")}
      {...props}
    >
      <path
        fill="none"
        d="M1 0.5L4 3.5L7 0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
