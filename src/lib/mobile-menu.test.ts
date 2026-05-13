import { describe, it, expect } from 'vitest';
import { isOutsideMenuClick, mobileMenuView } from './mobile-menu';

describe('mobileMenuView', () => {
  it('returns closed-state descriptor when open=false', () => {
    expect(mobileMenuView(false)).toEqual({
      panelHidden: true,
      ariaExpanded: 'false',
      ariaLabel: 'Open menu',
      iconOpenHidden: false,
      iconCloseHidden: true,
    });
  });

  it('returns open-state descriptor when open=true', () => {
    expect(mobileMenuView(true)).toEqual({
      panelHidden: false,
      ariaExpanded: 'true',
      ariaLabel: 'Close menu',
      iconOpenHidden: true,
      iconCloseHidden: false,
    });
  });
});

describe('isOutsideMenuClick', () => {
  function setup() {
    const toggle = document.createElement('button');
    const toggleChild = document.createElement('span');
    toggle.appendChild(toggleChild);

    const panel = document.createElement('div');
    const panelChild = document.createElement('a');
    panel.appendChild(panelChild);

    const outside = document.createElement('p');

    document.body.append(toggle, panel, outside);
    return { toggle, toggleChild, panel, panelChild, outside };
  }

  it('returns false when target is inside the panel', () => {
    const { toggle, panel, panelChild } = setup();
    expect(isOutsideMenuClick(panelChild, panel, toggle)).toBe(false);
  });

  it('returns false when target is inside the toggle', () => {
    const { toggle, toggleChild, panel } = setup();
    expect(isOutsideMenuClick(toggleChild, panel, toggle)).toBe(false);
  });

  it('returns true when target is outside both', () => {
    const { toggle, panel, outside } = setup();
    expect(isOutsideMenuClick(outside, panel, toggle)).toBe(true);
  });

  it('returns false when target is null', () => {
    const { toggle, panel } = setup();
    expect(isOutsideMenuClick(null, panel, toggle)).toBe(false);
  });

  it('treats missing panel/toggle as not-containing', () => {
    const { outside } = setup();
    expect(isOutsideMenuClick(outside, null, null)).toBe(true);
  });
});
