export interface MobileMenuView {
  readonly panelHidden: boolean;
  readonly ariaExpanded: 'true' | 'false';
  readonly ariaLabel: 'Open menu' | 'Close menu';
  readonly iconOpenHidden: boolean;
  readonly iconCloseHidden: boolean;
}

export function mobileMenuView(open: boolean): MobileMenuView {
  return {
    panelHidden: !open,
    ariaExpanded: open ? 'true' : 'false',
    ariaLabel: open ? 'Close menu' : 'Open menu',
    iconOpenHidden: open,
    iconCloseHidden: !open,
  };
}

export function isOutsideMenuClick(
  target: Node | null,
  panel: Node | null,
  toggle: Node | null,
): boolean {
  if (!target) return false;
  if (panel?.contains(target)) return false;
  if (toggle?.contains(target)) return false;
  return true;
}
