import React from 'react';

interface PantryoLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textColor?: string;
  subtitle?: string;
}

/**
 * PantryoLogo component
 * 
 * Recreates the official Pantryo logo:
 * - Stylized teal archway letter 'P' (#0E766E)
 * - Lower right pantry shelf with preserve jar (olive label) & flour bag (apple motif)
 * - Warm ivory/soft cream backdrop (#FAF7EE)
 */
export const PantryoLogo: React.FC<PantryoLogoProps> = ({
  className = '',
  size = 38,
  showText = false,
  textColor = '#0D3B37',
  subtitle = 'Smart Kitchen Inventory',
}) => {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        style={{ width: dimension, height: dimension }}
        className="relative shrink-0 rounded-2xl overflow-hidden flex items-center justify-center shadow-xs bg-[#FAF7EE] border border-[#E2DDD0]"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-0.5"
        >
          {/* Warm ivory background */}
          <rect width="100" height="100" rx="20" fill="#FAF7EE" />

          {/* Stylized Archway 'P' - Main Silhouette */}
          {/* Outer contour: Left stem (x=16 to 34), top arch (y=14), right rounded bowl (x=84, y=38) */}
          <path
            d="M16 88V34C16 19 28 12 48 12C68 12 84 20 84 38C84 53 74 61 58 63C52 63.5 44 65 38 72H34V88H16Z"
            fill="#0E766E"
          />

          {/* Inner negative space for the P bowl */}
          <path
            d="M34 26H48C58 26 65 30.5 65 38C65 45.5 58 50 48 50H34V26Z"
            fill="#FAF7EE"
          />

          {/* Right vertical pantry frame line */}
          <path
            d="M84 48V88"
            stroke="#0E766E"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Horizontal shelf dividing line at bottom */}
          <rect x="22" y="86" width="62" height="3.5" rx="1.75" fill="#0E766E" />

          {/* Upper shelf divider connecting from P loop to right wall */}
          <path
            d="M58 61H84"
            stroke="#0E766E"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Shelf Item 1: Glass Preserve Jar with Olive Motif */}
          <g transform="translate(37, 65)">
            {/* Screw-top Lid */}
            <rect x="1" y="0" width="14" height="2.5" rx="0.7" fill="#0E766E" />
            {/* Jar Neck */}
            <rect x="3" y="2.5" width="10" height="1.5" rx="0.4" fill="#0E766E" />
            {/* Jar Body */}
            <rect x="0" y="4" width="16" height="17" rx="3.5" fill="#0E766E" />
            {/* Cream Label */}
            <rect x="2.5" y="7" width="11" height="11" rx="1.5" fill="#FAF7EE" />
            {/* Olive on Label */}
            <ellipse
              cx="8"
              cy="12.5"
              rx="2.6"
              ry="3.4"
              fill="#0E766E"
              transform="rotate(-15 8 12.5)"
            />
            {/* Olive Stem */}
            <path
              d="M8 9.2C8 8.4 8.7 7.8 9.8 7.8"
              stroke="#0E766E"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
          </g>

          {/* Shelf Item 2: Flour / Grain Sack with Apple Motif */}
          <g transform="translate(58, 62)">
            {/* Ruffled/Crinkled Bag Top */}
            <path
              d="M2.5 4L5 1.5L8 3.5L11 1.5L14 3.5L16.5 1.5L19 4L18 7H3.5L2.5 4Z"
              fill="#0E766E"
            />
            {/* Sack Body */}
            <path
              d="M3.5 7C2.5 11 0.8 17.5 1.8 21.5C2.2 23.5 3.8 24 6 24H16C18.2 24 19.8 23.5 20.2 21.5C21.2 17.5 19.5 11 18.5 7H3.5Z"
              fill="#0E766E"
            />
            {/* Apple Emblem */}
            <circle cx="11" cy="15.5" r="4.2" fill="#FAF7EE" />
            {/* Apple Stem and Leaf */}
            <path
              d="M11 11.2V9.8"
              stroke="#FAF7EE"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M11 10.5C12.4 10 13.5 10.6 13.5 10.6C13.5 10.6 13 11.6 11.5 11.2"
              fill="#FAF7EE"
            />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            style={{ color: textColor }}
            className="text-base font-black tracking-tight leading-none"
          >
            Pantryo
          </span>
          {subtitle && (
            <span className="text-[10px] text-teal-800 font-medium tracking-wide mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
