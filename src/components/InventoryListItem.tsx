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
import {
  getItemDisplayName,
  formatLocalizedQuantityUnit,
  getLocalizedBadge,
  getLocalizedPackaging,
  getLocalizedStorageTip,
  getLocalizedOrigin,
} from '../utils/foodTranslator';

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
  isSelected?: boolean;
  onToggleSelect?: () => void;
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
  isSelected = false,
  onToggleSelect,
}) => {
  const isFreezer = item.locationType === 'FREEZER';
  const daysLeft = item.daysUntilExpiration;
  const isSoon = item.isExpiringSoon || (daysLeft !== null && daysLeft <= 3);
  const displayName = getItemDisplayName(item, lang);
  const visual = getFoodVisual(displayName, item.categoryName);
  const CategoryIcon = visual.icon;

  if (!isExpanded) {
    /* COMPACT / COLLAPSED ROW - M3 Surface Container Low */
    return (
      <div
        id={`inventory-item-collapsed-${item.id}`}
        onClick={onToggleExpand}
        className={`p-2.5 sm:p-3 rounded-[16px] bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:border-[var(--md-sys-color-outline)] transition-all flex items-center justify-between gap-2.5 cursor-pointer group select-none ${
          isSelected ? 'bg-[var(--md-sys-color-primary-container)]/30 ring-2 ring-[var(--md-sys-color-primary)]' : ''
        }`}
      >
        {/* Left: Select Checkbox + Circle Quick-Consume + Food Badge + Title & Qty */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Multi-selection Checkbox */}
          {onToggleSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-white shadow-xs'
                  : 'border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-lowest)]'
              }`}
              title={lang === 'FR' ? (isSelected ? 'Désélectionner' : 'Sélectionner') : (isSelected ? 'Deselect' : 'Select')}
            >
              {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
            </button>
          )}

          {/* Empty circle check button */}
          <button
            id={`consume-btn-${item.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConsume(item);
            }}
            className="w-5 h-5 rounded-full border-2 border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/30 flex items-center justify-center shrink-0 transition-all cursor-pointer"
            title={lang === 'FR' ? 'Consommer cet article' : 'Mark as consumed'}
          >
            <span className="sr-only">Consume</span>
          </button>

          {/* Food Type Image & Icon Badge */}
          <div className="shrink-0">
            <FoodVisualBadge
              itemName={displayName}
              categoryName={item.categoryName}
              imageUrl={item.imageUrl}
              size="sm"
            />
          </div>

          {/* Title & Quantity */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] truncate leading-tight">
                {displayName}
              </h3>
              {/* Status Badge */}
              {isSoon && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] tracking-tight shrink-0">
                  {daysLeft !== null && daysLeft <= 0
                    ? (lang === 'FR' ? 'EXP: 0j' : 'EXP: 0d')
                    : (lang === 'FR' ? `EXP: ${daysLeft}j` : `EXP: ${daysLeft}d`)}
                </span>
              )}
              {isFreezer && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] tracking-tight shrink-0 flex items-center gap-0.5">
                  <Snowflake className="w-2.5 h-2.5" />
                  <span>{lang === 'FR' ? 'CONGELÉ' : 'FROZEN'}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-medium text-[var(--md-sys-color-secondary)]">
                {formatLocalizedQuantityUnit(item.quantity, item.unit, lang)}
              </span>

              {item.isLeftover && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] inline-flex items-center gap-1">
                  <span>🍲</span>
                  <span>{lang === 'FR' ? 'Reste' : 'Leftover'}</span>
                </span>
              )}

              <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
                • {getLocationLocalizedName(item.locationName, lang)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Delete Icon Button */}
        <button
          id={`delete-btn-${item.id}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id, item.name);
          }}
          className="p-1.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)] rounded-full transition-colors shrink-0 cursor-pointer"
          title={lang === 'FR' ? "Supprimer l'article" : 'Delete item'}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  /* EXPANDED DETAILED CARD - M3 Surface Container */
  return (
    <div
      id={`inventory-item-expanded-${item.id}`}
      onClick={onToggleExpand}
      className="p-3.5 sm:p-4 rounded-[20px] bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] shadow-none space-y-3 cursor-pointer transition-all select-none"
    >
      {/* Top Row: Food Image/Icon + Title + Quantity & Category Pill + Location Badge */}
      <div className="flex items-start gap-2.5">
        {onToggleSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className={`w-6 h-6 mt-1 rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isSelected
                ? 'bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-white shadow-xs'
                : 'border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-lowest)]'
            }`}
            title={lang === 'FR' ? (isSelected ? 'Désélectionner' : 'Sélectionner') : (isSelected ? 'Deselect' : 'Select')}
          >
            {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : null}
          </button>
        )}

        {/* Food Type Image & Icon Badge */}
        <div className="shrink-0">
          <FoodVisualBadge
            itemName={displayName}
            categoryName={item.categoryName}
            imageUrl={item.imageUrl}
            size="md"
          />
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="font-bold text-sm sm:text-base text-[var(--md-sys-color-on-surface)] truncate leading-snug">
              {displayName}
            </h3>

            {/* Storage Location Badge (Top Right) */}
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                isFreezer
                  ? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border border-[var(--md-sys-color-outline-variant)]/60'
                  : item.locationType === 'SPICE_RACK'
                  ? 'bg-amber-100/80 text-amber-900 border border-amber-300'
                  : item.locationType === 'PANTRY'
                  ? 'bg-amber-100/80 text-amber-900 border border-amber-300'
                  : 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border border-[var(--md-sys-color-outline-variant)]/60'
              }`}
            >
              {isFreezer ? (
                <Snowflake className="w-2.5 h-2.5" />
              ) : item.locationType === 'SPICE_RACK' ? (
                <Flame className="w-2.5 h-2.5 text-amber-600" />
              ) : item.locationType === 'PANTRY' ? (
                <Boxes className="w-2.5 h-2.5" />
              ) : (
                <Refrigerator className="w-2.5 h-2.5" />
              )}
              <span>{getLocationLocalizedName(item.locationName, lang)}</span>
            </span>
          </div>

          {/* Food Type & Quantity Pill + Category Pill */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]">
              {formatLocalizedQuantityUnit(item.quantity, item.unit, lang)}
            </span>

            {/* Food Category Tag with Icon */}
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border border-black/5 flex items-center gap-1 ${visual.bgColor} ${visual.textColor}`}
            >
              <CategoryIcon className="w-3 h-3" />
              <span>{getCategoryLocalizedName(item.categoryName, lang)}</span>
            </span>

            {item.isLeftover && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                <span>🍲</span>
                <span>{lang === 'FR' ? 'Reste cuisiné' : 'Cooked Leftover'}</span>
              </span>
            )}

            {item.barcode && (
              <span
                className="text-[10px] font-mono font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1"
                title={`UPC: ${item.barcode}`}
              >
                <Barcode className="w-3 h-3 text-slate-400" />
                {item.barcode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expiration or Freezer Metric Section */}
      {isFreezer ? (
        /* Freezer Duration Tracking (Months Frozen vs Shelf-Life) */
        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-blue-900 flex items-center gap-1">
              <Snowflake className="w-3 h-3 text-blue-600" />
              {lang === 'FR'
                ? `Congelé : ${item.monthsFrozen ?? 2.5} mois`
                : `Frozen: ${item.monthsFrozen ?? 2.5} mos`}
            </span>
            <span className="text-blue-700/80 text-[10px] sm:text-[11px]">
              {lang === 'FR'
                ? `Max ${item.monthsFrozenShelfLife ?? 6} mois`
                : `Max ${item.monthsFrozenShelfLife ?? 6} mos`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-blue-200/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (item.frozenPercentage ?? 50) >= 80 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, item.frozenPercentage ?? 50)}%` }}
            />
          </div>
        </div>
      ) : (
        /* Chilled / Pantry Shelf-Life Alert */
        <div className="p-2.5 rounded-xl bg-[#FAF7EE] border border-[#EAE5D8] flex items-center justify-between gap-2 text-xs">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
              isSoon
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {daysLeft !== null
              ? daysLeft <= 0
                ? lang === 'FR' ? "Expiré aujourd'hui" : 'Expired today'
                : lang === 'FR'
                ? `Expire dans ${daysLeft} j`
                : `Expires in ${daysLeft} d`
              : lang === 'FR' ? 'Aucune date' : 'No date'}
          </span>

          {item.notes ? (
            <span className="text-[10px] text-[#527470] truncate max-w-[180px] italic">
              {getLocalizedStorageTip(item.notes, lang)}
            </span>
          ) : (
            <span className="text-[10px] text-[#527470]">
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

      {/* Visual Packaging & Extraction Details Table (Extracted from photo OCR/Vision) */}
      {(item.brand || item.gradeOrigin || item.packagingFormat || (item.dietaryBadges && item.dietaryBadges.length > 0) || item.storageTip || item.unopenedLocation) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="rounded-2xl bg-[#FAF7EE] border border-[#E2DAD0] p-2.5 space-y-2 text-xs"
        >
          <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-1.5">
            <span className="font-extrabold text-[11px] text-[#0D3B37] flex items-center gap-1.5">
              <span>🏷️</span>
              <span>{lang === 'FR' ? 'Attributs extraits de l’emballage' : 'Extracted Packaging Attributes'}</span>
            </span>
            {item.brand && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-900 border border-teal-200">
                {item.brand}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
            {item.gradeOrigin && (
              <div className="flex flex-col bg-white p-2 rounded-xl border border-[#EAE3D6]">
                <span className="text-[9px] font-bold text-[#6D8371] uppercase tracking-wider">
                  {lang === 'FR' ? 'Grade & Origine' : 'Grade & Origin'}
                </span>
                <span className="font-semibold text-[#1F3323]">{getLocalizedOrigin(item.gradeOrigin, lang)}</span>
              </div>
            )}

            {item.packagingFormat && (
              <div className="flex flex-col bg-white p-2 rounded-xl border border-[#EAE3D6]">
                <span className="text-[9px] font-bold text-[#6D8371] uppercase tracking-wider">
                  {lang === 'FR' ? 'Format d’emballage' : 'Packaging Format'}
                </span>
                <span className="font-semibold text-[#1F3323]">{getLocalizedPackaging(item.packagingFormat, lang)}</span>
              </div>
            )}

            {item.unopenedLocation && (
              <div className="flex flex-col bg-white p-2 rounded-xl border border-[#EAE3D6]">
                <span className="text-[9px] font-bold text-[#6D8371] uppercase tracking-wider">
                  {lang === 'FR' ? 'Stockage non ouvert' : 'Unopened Storage'}
                </span>
                <span className="font-semibold text-[#1F3323]">
                  {getLocationLocalizedName(item.unopenedLocation, lang)}
                  {item.unopenedShelfLifeDays ? ` (${item.unopenedShelfLifeDays} ${lang === 'FR' ? 'j' : 'days'})` : ''}
                </span>
              </div>
            )}

            {item.openedLocation && (
              <div className="flex flex-col bg-white p-2 rounded-xl border border-[#EAE3D6]">
                <span className="text-[9px] font-bold text-[#6D8371] uppercase tracking-wider">
                  {lang === 'FR' ? 'Après ouverture' : 'After Opening'}
                </span>
                <span className="font-semibold text-[#1F3323]">
                  {getLocationLocalizedName(item.openedLocation, lang)}
                  {item.openedShelfLifeDays ? ` (${item.openedShelfLifeDays} ${lang === 'FR' ? 'j' : 'days'})` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Dietary / Feature Badges */}
          {item.dietaryBadges && item.dietaryBadges.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {item.dietaryBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100/90 text-emerald-900 border border-emerald-300"
                >
                  ✓ {getLocalizedBadge(badge, lang)}
                </span>
              ))}
            </div>
          )}

          {/* Practical Storage & Freezing Tip */}
          {item.storageTip && (
            <div className="p-2 rounded-xl bg-teal-50/80 border border-teal-200/80 text-[11px] text-teal-950 flex items-start gap-1.5">
              <span className="shrink-0 text-sm">💡</span>
              <span className="font-medium leading-relaxed">{getLocalizedStorageTip(item.storageTip, lang)}</span>
            </div>
          )}

          {item.freezerTip && (
            <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200/80 text-[11px] text-blue-950 flex items-start gap-1.5">
              <span className="shrink-0 text-sm">❄️</span>
              <span className="font-medium leading-relaxed">{getLocalizedStorageTip(item.freezerTip, lang)}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Row: Household Attribution Badge & Actions */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="pt-2 border-t border-[#EEF4ED] flex items-center justify-between gap-1 flex-wrap"
      >
        {/* Attribution Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <img
            src={item.addedByAvatar || '/avatars/chef-cat.svg'}
            alt={item.addedByName}
            className="w-4 h-4 rounded-full object-cover"
          />
          <span className="text-[11px] font-bold text-[#556D58]">
            {lang === 'FR' ? 'par' : 'by'} {item.addedByName || (lang === 'FR' ? 'Membre' : 'Member')}
          </span>
        </div>

        {/* Action buttons - M3 Tonal & Pill controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* +Cart */}
          <button
            id={`add-cart-btn-${item.id}`}
            type="button"
            onClick={() => onAddToCart(item)}
            title={lang === 'FR' ? 'Ajouter à la liste' : 'Add to cart'}
            className="py-1 px-3 bg-[var(--md-sys-color-secondary-container)] hover:brightness-95 text-[var(--md-sys-color-on-secondary-container)] rounded-full text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
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
              className="py-1 px-3 bg-[var(--md-sys-color-tertiary-container)] hover:brightness-95 text-[var(--md-sys-color-on-tertiary-container)] rounded-full text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5" />
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
            className="py-1 px-3 bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-full text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? 'Modifier' : 'Edit'}</span>
          </button>

          {/* Mark Consumed Check */}
          <button
            id={`consumed-btn-${item.id}`}
            type="button"
            onClick={() => onConsume(item)}
            title={lang === 'FR' ? 'Consommer cet article' : 'Mark as consumed'}
            className="p-1.5 bg-[var(--md-sys-color-primary)] hover:brightness-105 text-[var(--md-sys-color-on-primary)] rounded-full text-xs font-bold flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {/* Delete Item */}
          <button
            id={`delete-btn-expanded-${item.id}`}
            type="button"
            onClick={() => onDelete(item.id, item.name)}
            title={lang === 'FR' ? "Supprimer l'article" : 'Delete item'}
            className="p-1.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)] rounded-full text-xs font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
