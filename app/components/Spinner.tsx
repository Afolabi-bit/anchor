interface SpinnerProps {
  size?: "xs" | "sm" | "md";
  className?: string;
}

const sizeMap = {
  xs: "w-3 h-3 border",
  sm: "w-3.5 h-3.5 border-[1.5px]",
  md: "w-4 h-4 border-2",
};

export default function Spinner({ size = "sm", className = "" }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full border-white/30 border-t-white animate-spin ${sizeMap[size]} ${className}`}
    />
  );
}
