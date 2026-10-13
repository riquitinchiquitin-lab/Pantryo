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

  // Only display real user-captured images; stock/unsplash photos are removed in favor of clean category icons
  const isUserImage = Boolean(imageUrl && imageUrl.trim() && !imageUrl.includes('unsplash.com') && !imageError);

  const dimensions = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-13 h-13 rounded-2xl',
    lg: 'w-16 h-16 rounded-2xl',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  const badgeIconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  }[size];

  return (
    <div className={`relative shrink-0 ${dimensions} overflow-hidden border border-[#E5DFD0] shadow-2xs group select-none`}>
      {isUserImage ? (
        <>
          <img
            src={imageUrl!}
            alt={itemName}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center"
          />
          {showCategoryIcon && (
            <div
              className={`absolute bottom-0 right-0 p-1 rounded-tl-lg bg-white/90 backdrop-blur-xs shadow-2xs ${visual.textColor}`}
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
