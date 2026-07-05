import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "orange" | "navy-outline" | "navy-fill";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream";

const SIZES: Record<Size, string> = {
  md: "h-12 px-6 text-sm",
  lg: "h-14 px-7 text-[15px]",
};

const VARIANTS: Record<Variant, string> = {
  // Orange CTA with brass-glow inset on hover (utility defined in globals.css)
  orange:
    "bg-orange text-white shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:bg-[#E94B14] focus-visible:ring-orange btn-glow",
  // Navy outline — switches to brass on hover (utility in globals.css)
  "navy-outline":
    "border border-navy text-navy bg-transparent focus-visible:ring-navy btn-outline-brass",
  "navy-fill":
    "bg-navy text-cream hover:bg-[#142B40] focus-visible:ring-navy",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

type ButtonAsLink = CommonProps & {
  href: string;
  external?: boolean;
} & Omit<ComponentPropsWithoutRef<"a">, "href" | "className" | "children">;

type ButtonAsButton = CommonProps & {
  href?: undefined;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

export type ButtonProps = ButtonAsLink | ButtonAsButton;

export default function Button(props: ButtonProps) {
  const {
    variant = "orange",
    size = "lg",
    className = "",
    children,
  } = props;

  const classes = [BASE, SIZES[size], VARIANTS[variant], className]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href) {
    const {
      href,
      external,
      variant: _variant,
      size: _size,
      className: _className,
      children: _children,
      ...rest
    } = props;
    void _variant;
    void _size;
    void _className;
    void _children;
    if (external || href.startsWith("http")) {
      return (
        <a
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
          {...rest}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const {
    variant: _variant,
    size: _size,
    className: _className,
    children: _children,
    ...rest
  } = props as ButtonAsButton;
  void _variant;
  void _size;
  void _className;
  void _children;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
