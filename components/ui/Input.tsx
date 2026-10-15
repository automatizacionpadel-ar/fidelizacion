import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        background: "#20201F",
        color: "#F0F0EE",
        border: "1px solid #3D3D3B",
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: 15,
        outline: "none",
        ...props.style,
      }}
    />
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        fontSize: 13,
        fontWeight: 600,
        color: "#9A9A96",
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}
