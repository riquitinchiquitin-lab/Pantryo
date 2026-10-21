# Integrated In-App Alerts & Bottom Sheet Confirmations

Replace all browser popups (`window.alert`, `window.confirm`) with an integrated in-app alert and feedback system adhering to the selected preferences:
1. **General Feedback Alerts & Errors**: Bottom floating toast notifications with auto-dismiss and tactile action/dismiss buttons.
2. **Action Confirmations (Deletions & Discards)**: An embedded bottom sheet card with clear Confirm and Cancel actions.

---

## User Review Required

> [!IMPORTANT]
> The implementation plan incorporates your selections:
> - **Toast Notifications**: Floating at the bottom of the viewport above the navigation bar, auto-dismissing after 3.5 seconds with support for success, error, warning, and info states.
> - **Confirmations**: An embedded bottom sheet card with blurred backdrop, status icon badge, localized Confirm/Cancel buttons, and destructive danger styling for deletions.
> - **Zero Browser Popups**: All `window.alert` and `window.confirm` calls will be replaced with asynchronous in-app counterparts, along with a protective runtime interceptor so no browser modal can ever freeze or obstruct the app.

---

## Proposed Changes

### 1. Alert & Confirmation Architecture (`src/contexts/AlertToastContext.tsx`)
Create a lightweight, unified React context and component:
- **`showToast(options: ToastOptions)`**:
  - Types: `'success' | 'error' | 'warning' | 'info'`.
  - Floating container positioned safely above the bottom navigation bar (`bottom-20 sm:bottom-6`) with iOS safe-area support (`env(safe-area-inset-bottom)`).
  - Material 3 aesthetic: warm card background, status border accent, Lucide iconography (`CheckCircle2`, `AlertCircle`, `AlertTriangle`, `Info`), localized copy, close button, and optional action button (e.g. Undo).
  - Configurable duration (default 3.5s) with auto-dismiss animation.
- **`confirmAction(options: ConfirmOptions): Promise<boolean>`**:
  - Replaces `window.confirm(msg)` with `const confirmed = await confirmAction({ title, message, variant: 'danger' })`.
  - Embedded bottom sheet card sliding up with a darkened backdrop.
  - Distinct styling for destructive actions (rose/crimson delete button) and neutral actions (teal confirm button).
  - Keyboard accessible (Escape closes / cancels, Enter confirms) and fully touch-friendly.
- **`showAlert(message: string, type?: ToastType)`**:
  - Clean drop-in replacement for `window.alert`.

### 2. Integration into Application Entry Points (`src/App.tsx`)
- Wrap the application tree with `<AlertToastProvider>`.
- Add a runtime guard that redirects any unhandled `window.alert` or `window.confirm` to the in-app toast/sheet, ensuring complete protection in iframes and iOS PWAs.

### 3. Replace Legacy Browser Popups Across All Views
- **`src/components/AddEditItemModal.tsx`**:
  - Replace `window.confirm(...)` when deleting an inventory item with `await confirmAction(...)`.
  - Replace `alert(...)` on error with `showToast({ type: 'error', message: ... })`.
- **`src/components/MobileSimulator.tsx`**:
  - Replace `window.confirm(...)` in `handleDeleteItem` with `await confirmAction(...)`.
  - Replace top `bannerNotice` state with `showToast({ type: 'success', message: ... })` for a consistent experience across all tabs.
- **`src/components/CookingIdeasView.tsx`**:
  - Replace `window.confirm(...)` when deleting a custom recipe with `await confirmAction(...)`.
  - Replace temporary text alert banners with `showToast(...)`.
- **`src/components/AddRecipeModal.tsx`**:
  - Replace `window.confirm(...)` when resetting/changing the recipe source with `await confirmAction(...)`.
- **`src/components/FamilySyncView.tsx` & `src/components/AdminManagementModal.tsx`**:
  - Ensure all member removals, token resets, and backup operations use the in-app bottom sheet confirmation and bottom toasts.

---

## Verification Plan

### Automated Verification
1. Run `compile_applet` to ensure full TypeScript compilation without errors.
2. Run `lint_applet` to verify syntax and import integrity.

### User Experience & Interactive Verification
1. **Delete Item Confirmation**: Click Delete on an inventory item in both the list view and edit modal. Verify the embedded bottom sheet appears with Confirm / Cancel buttons without any native browser popup.
2. **Bottom Toast Alerts**: Trigger an inventory action (e.g., adding an item, consuming stock, or generating a shopping list) and verify the sleek bottom floating toast notification appears, is readable, and auto-dismisses after 3.5 seconds.
3. **Cancel & Confirm**: Verify that clicking Cancel dismisses the bottom sheet without mutating data, and clicking Confirm executes the deletion immediately.
4. **Mobile & iOS Viewport**: Verify that the toast and bottom sheet correctly clear the iOS home indicator bar and do not cause scrolling or zooming.
