import React, { useState } from 'react';
import { getFoodVisual } from '../utils/foodVisuals';
import { FoodItemImage } from '../utils/foodIllustrations';

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

  // Only display real user-captured images; stock/unsplash photos fallback to curated category illustrations
  const isUserImage = Boolean(imageUrl && imageUrl.trim() && !imageUrl.includes('unsplash.com') && !imageError);

  const dimensions = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-13 h-13 rounded-2xl',
    lg: 'w-16 h-16 rounded-2xl',
  }[size];

  const badgeIconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  }[size];

  if (isUserImage && imageUrl) {
    return (
      <div className={`relative shrink-0 ${dimensions} overflow-hidden border border-[#E5DFD0] shadow-2xs group select-none`}>
        <img
          src={imageUrl}
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
      </div>
    );
  }

  return (
    <FoodItemImage
      name={itemName}
      category={categoryName}
      size={size}
      className={`${dimensions} border border-[#E5DFD0]`}
    />
  );
};

