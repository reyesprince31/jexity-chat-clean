import * as React from "react";

type JexityLogoProps = React.SVGProps<SVGSVGElement>;

/**
 * Jexity brand mark with configurable sizing and classes.
 */
export function JexityLogo({
  className,
  width = 15,
  height = 15,
  fill = "none",
  ...svgProps
}: JexityLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 587 610"
      fill={fill}
      className={className}
      {...svgProps}
    >
      <path
        d="M587 0H0V128.808H587V0Z"
        fill="url(#paint0_linear_5821_404133)"
      />
      <path
        d="M587 240.749H0V369.251H587V240.749Z"
        fill="url(#paint1_linear_5821_404133)"
      />
      <path
        d="M587 481.498H0V610H587V481.498Z"
        fill="url(#paint2_linear_5821_404133)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_5821_404133"
          x1="0"
          y1="305.153"
          x2="4093.33"
          y2="305.153"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#40A4B4" />
          <stop offset="0.08" stopColor="#329AAB" />
          <stop offset="0.32" stopColor="#0E8194" />
          <stop offset="0.45" stopColor="#00778B" />
          <stop offset="0.6" stopColor="#007787" />
          <stop offset="1" stopColor="#007377" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_5821_404133"
          x1="0"
          y1="305.153"
          x2="4093.33"
          y2="305.153"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#40A4B4" />
          <stop offset="0.08" stopColor="#329AAB" />
          <stop offset="0.32" stopColor="#0E8194" />
          <stop offset="0.45" stopColor="#00778B" />
          <stop offset="0.6" stopColor="#007787" />
          <stop offset="1" stopColor="#007377" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_5821_404133"
          x1="0"
          y1="305.153"
          x2="4093.33"
          y2="305.153"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#40A4B4" />
          <stop offset="0.08" stopColor="#329AAB" />
          <stop offset="0.32" stopColor="#0E8194" />
          <stop offset="0.45" stopColor="#00778B" />
          <stop offset="0.6" stopColor="#007787" />
          <stop offset="1" stopColor="#007377" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default JexityLogo;
