import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, CSSProperties> = {
  primary: { background: "#7AB619", color: "#20201F", border: "1px solid #7AB619" },
  secondary: { background: "#2A2A29", color: "#F0F0EE", border: "1px solid #3D3D3B" },
  ghost: { background: "transparent", color: "#9A9A96", border: "1px solid transparent" },
  danger: { background: "transparent", color: "#f87171", border: "1px solid #3D3D3B" },
};

export function Button({
  variant = "primary",
  style,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      {...props}
      style={{
        borderRadius: 10,
        padding: "10px 16px",
        fontWeight: 600,
        fontSize: 15,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
