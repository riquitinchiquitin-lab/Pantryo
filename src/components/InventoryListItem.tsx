import React from 'react';
import {
  Snowflake,
  Refrigerator,
  Boxes,
  Calendar,
  Flame,
  ShoppingCart,
  Edit3,
  Check,
  Trash2,
  Barcode,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { FoodVisualBadge } from './FoodVisualBadge';
import { getFoodVisual } from '../utils/foodVisuals';
import { getCategoryLocalizedName, getLocationLocalizedName } from '../utils/i18n';

interface InventoryListItemProps {
  item: InventoryItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onConsume: (item: InventoryItem) => void;
  onDelete: (id: string, name: string) => void;
  onEdit: (item: InventoryItem) => void;
  onAddToCart: (item: InventoryItem) => void;
  onDefrost: (item: InventoryItem) => void;
  isDefrosting: boolean;
  lang: 'EN' | 'FR';
}

export const InventoryListItem: React.FC<InventoryListItemProps> = ({
  item,
  isExpanded,
  onToggleExpand,
  onConsume,
  onDelete,
  onEdit,
  onAddToCart,
  onDefrost,
  isDefrosting,
  lang,
}) => {
  const isFreezer = item.locationType === 'FREEZER';
  const daysLeft = item.daysUntilExpiration;
  const isSoon = item.isExpiringSoon || (daysLeft !== null && daysLeft <= 3);
  const visual = getFoodVisual(item.name, item.categoryName);
  const CategoryIcon = visual.icon;

  if (!isExpanded) {
    /* COMPACT / COLLAPSED ROW (matches user screenshot 1) */
    return (
      <div
        id={`inventory-item-collapsed-${item.id}`}
        onClick={onToggleExpand}
        className="p-2 sm:p-2.5 rounded-2xl bg-white border border-[#D5E1D2] hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-2.5 cursor-pointer group select-none"
      >
        {/* Left: Circle Quick-Consume + Food Badge + Title & Qty */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Empty circle check button */}
          <button
            id={`consume-btn-${item.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConsume(item);
            }}
            className="w-5 h-5 rounded-full border-2 border-[#CBD9C8] hover:border-emerald-600 hover:bg-emerald-50 flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer"
            title={lang === 'FR' ? 'Consommer cet article' : 'Mark as consumed'}
          >
            <span className="sr-only">Consume</span>
          </button>

          {/* Food Type Image & Icon Badge */}
          <div className="shrink-0">
            <FoodVisualBadge
              itemName={item.name}
              categoryName={item.categoryName}
              imageUrl={item.imageUrl}
              size="sm"
            />
          </div>

          {/* Title & Quantity */}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-xs sm:text-sm text-[#1F3323] truncate leading-tight group-hover:text-emerald-900 transition-colors">
              {item.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EDF3EC] text-[#344837] inline-block">
                {item.quantity} {item.unit}
              </span>
              {item.isLeftover && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/80 inline-flex items-center gap-0.5 shadow-2xs">
                  <span>🍲</span>
                  <span>{lang === 'FR' ? 'Reste' : 'Leftover'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Subtle Trash Icon */}
        <button
          id={`delete-btn-${item.id}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id, item.name);
          }}
          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer"
          title={lang === 'FR' ? "Supprimer l'article" : 'Delete item'}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* EXPANDED DETAILED CARD (matches user screenshot 2) */
  return (
    <div
      id={`inventory-item-expanded-${item.id}`}
      onClick={onToggleExpand}
      className="p-3.5 rounded-3xl bg-white border border-[#D5E1D2] shadow-xs space-y-3 cursor-pointer transition-all animate-fade-in"
    >
      {/* Top Row: Food Image/Icon + Title + Quantity & Category Pill + Location Badge */}
      <div className="flex items-start gap-3">
        {/* Food Type Image & Icon Badge */}
        <div className="shrink-0">
          <FoodVisualBadge
            itemName={item.name}
            categoryName={item.categoryName}
            imageUrl={item.imageUrl}
            size="md"
          />
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="font-bold text-xs sm:text-sm text-[#1F3323] truncate leading-snug">
              {item.name}
            </h3>

            {/* Storage Location Badge (Top Right) */}
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                isFreezer
                  ? 'bg-[#EBF5FF] text-[#1E40AF] border border-[#BFDBFE]'
                  : item.locationType === 'PANTRY'
                  ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                  : 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
              }`}
            >
              {isFreezer ? (
                <Snowflake className="w-2.5 h-2.5" />
              ) : item.locationType === 'PANTRY' ? (
                <Boxes className="w-2.5 h-2.5" />
              ) : (
                <Refrigerator className="w-2.5 h-2.5" />
              )}
              <span>{getLocationLocalizedName(item.locationName, lang)}</span>
            </span>
          </div>

          {/* Food Type & Quantity Pill + Category Pill */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EDF3EC] text-[#344837]">
              {item.quantity} {item.unit}
            </span>

            {/* Food Category Tag with Icon */}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${visual.bgColor} ${visual.textColor} ${visual.borderColor}`}
            >
              <CategoryIcon className="w-2.5 h-2.5" />
              <span>{getCategoryLocalizedName(item.categoryName, lang)}</span>
            </span>

            {item.isLeftover && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                <span>🍲</span>
                <span>{lang === 'FR' ? 'Reste cuisiné' : 'Cooked Leftover'}</span>
              </span>
            )}

            {item.barcode && (
              <span
                className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-1.5 py-0.2 rounded-md flex items-center gap-1"
                title={`UPC: ${item.barcode}`}
              >
                <Barcode className="w-2.5 h-2.5 text-blue-600" />
                {item.barcode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expiration or Freezer Metric Section */}
      {isFreezer ? (
        /* Freezer Duration Tracking (Months Frozen vs Shelf-Life) */
        <div className="p-2.5 rounded-2xl bg-[#F0F6FC] border border-[#D5E4F3] space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#2A4763] flex items-center gap-1">
              <Snowflake className="w-3 h-3 text-blue-500" />
              {lang === 'FR'
                ? `Congelé depuis ${item.monthsFrozen ?? 2.5} mois`
                : `Frozen ${item.monthsFrozen ?? 2.5} mos`}
            </span>
            <span className="text-[#64748B] text-[10px] sm:text-[11px] font-medium">
              {lang === 'FR'
                ? `Max ${item.monthsFrozenShelfLife ?? 6} mois conseillé`
                : `Max ${item.monthsFrozenShelfLife ?? 6} mos safe`}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#DCE7F3] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (item.frozenPercentage ?? 50) >= 80 ? 'bg-amber-500' : 'bg-[#2563EB]'
              }`}
              style={{ width: `${Math.min(100, item.frozenPercentage ?? 50)}%` }}
            />
          </div>
        </div>
      ) : (
        /* Chilled / Pantry Shelf-Life Alert */
        <div className="p-2.5 rounded-2xl bg-[#F4F8F3] border border-[#D5E5D3] flex items-center justify-between gap-2 text-xs">
          <span
            className={`px-2 py-0.5 rounded-xl text-[10px] font-bold flex items-center gap-1 ${
              isSoon
                ? 'bg-rose-100 text-rose-800'
                : 'bg-[#EDF3EC] text-[#39503D]'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {daysLeft !== null
              ? daysLeft <= 0
                ? lang === 'FR' ? "Expiré aujourd'hui" : 'Expired today'
                : lang === 'FR'
                ? `Expire dans ${daysLeft} jour${daysLeft === 1 ? '' : 's'}`
                : `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
              : lang === 'FR' ? 'Aucune date définie' : 'No expiration set'}
          </span>

          {item.notes ? (
            <span className="text-[10px] text-[#697F6C] truncate max-w-[180px] italic">
              {item.notes}
            </span>
          ) : (
            <span className="text-[10px] text-[#556D58]">
              {lang === 'FR' ? 'Frais & disponible' : 'Fresh & ready'}
            </span>
          )}
        </div>
      )}

      {/* Leftover Specific Smart Info Banner */}
      {item.isLeftover && (
        <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200/90 space-y-1 text-amber-950">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5">
              <span>🍲</span>
              <span>
                {lang === 'FR' ? 'Reste cuisiné' : 'Cooked Leftover'}
                {item.leftoverFoodType ? ` • ${item.leftoverFoodType}` : ''}
              </span>
            </span>
            {item.prepDate && (
              <span className="text-[10px] text-amber-800 font-medium">
                {lang === 'FR' ? 'Préparé le' : 'Prepared'} {new Date(item.prepDate).toLocaleDateString()}
              </span>
            )}
          </div>
          {item.leftoverSourceMeal && (
            <div className="text-[11px] text-amber-800 flex items-center gap-1">
              <span className="font-semibold">{lang === 'FR' ? 'Issu du repas :' : 'From meal:'}</span>
              <span>{item.leftoverSourceMeal}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Row: Household Attribution Badge ("by Yan") & Actions */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="pt-2 border-t border-[#EEF4ED] flex items-center justify-between gap-1 flex-wrap"
      >
        {/* Attribution Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <img
            src={item.addedByAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={item.addedByName}
            className="w-4 h-4 rounded-full object-cover"
          />
          <span className="text-[11px] font-bold text-[#556D58]">
            {lang === 'FR' ? 'par' : 'by'} {item.addedByName || 'Yan'}
          </span>
        </div>

        {/* Action buttons matching screenshot 2 */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* +Cart */}
          <button
            id={`add-cart-btn-${item.id}`}
            type="button"
            onClick={() => onAddToCart(item)}
            title={lang === 'FR' ? 'Ajouter à la liste' : 'Add to cart'}
            className="py-1 px-2.5 bg-[#EEF4EC] hover:bg-emerald-100 text-[#2D5A34] rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-3 h-3 text-emerald-700" />
            <span>{lang === 'FR' ? '+Panier' : '+Cart'}</span>
          </button>

          {/* Defrost Button for Freezer items */}
          {isFreezer && (
            <button
              id={`defrost-btn-${item.id}`}
              type="button"
              onClick={() => onDefrost(item)}
              disabled={isDefrosting}
              title={lang === 'FR' ? 'Décongeler' : 'Defrost'}
              className="py-1 px-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Flame className="w-3 h-3 text-amber-300" />
              <span>
                {isDefrosting
                  ? '...'
                  : lang === 'FR'
                  ? 'Décongeler'
                  : 'Defrost'}
              </span>
            </button>
          )}

          {/* Edit Item */}
          <button
            id={`edit-btn-${item.id}`}
            type="button"
            onClick={() => onEdit(item)}
            title={lang === 'FR' ? "Modifier l'article" : 'Edit item'}
            className="py-1 px-2.5 bg-[#F2ECE0] hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>{lang === 'FR' ? 'Modifier' : 'Edit'}</span>
          </button>

          {/* Mark Consumed Check */}
          <button
            id={`consumed-btn-${item.id}`}
            type="button"
            onClick={() => onConsume(item)}
            title={lang === 'FR' ? 'Consommer cet article' : 'Mark as consumed'}
            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>

          {/* Delete Item */}
          <button
            id={`delete-btn-expanded-${item.id}`}
            type="button"
            onClick={() => onDelete(item.id, item.name)}
            title={lang === 'FR' ? "Supprimer l'article" : 'Delete item'}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
