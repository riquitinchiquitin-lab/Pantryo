import React, { useState } from 'react';
import { getFoodVisual } from '../utils/foodVisuals';

interface FoodVisualBadgeProps {
  itemName: string;
  categoryName?: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showCategoryIcon?: boolean;
}

export const FoodVisualBadge: React.FC<FoodVisualBadgeProps> = ({
  itemName,
  categoryName = '',
  imageUrl,
  size = 'md',
  showCategoryIcon = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const visual = getFoodVisual(itemName, categoryName);
  const Icon = visual.icon;

  const resolvedImage = !imageError && (imageUrl || visual.defaultImage);

  const dimensions = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-14 h-14 rounded-2xl',
    lg: 'w-20 h-20 rounded-3xl',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  const badgeIconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <div className={`relative shrink-0 ${dimensions} overflow-hidden border ${visual.borderColor} shadow-2xs group`}>
      {resolvedImage ? (
        <>
          <img
            src={resolvedImage}
            alt={itemName}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
          {showCategoryIcon && (
            <div
              className={`absolute bottom-1 right-1 p-1 rounded-lg bg-white/95 backdrop-blur-xs shadow-xs border border-white/80 ${visual.textColor}`}
              title={visual.badgeLabel}
            >
              <Icon className={badgeIconSizes} />
            </div>
          )}
        </>
      ) : (
        <div className={`w-full h-full ${visual.bgColor} flex items-center justify-center ${visual.textColor}`}>
          <Icon className={iconSizes} />
        </div>
      )}
    </div>
  );
};
