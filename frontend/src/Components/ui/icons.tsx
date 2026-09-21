import React from 'react';

/*
 * CipherSprint icon set. Drawn on a 24px grid with a 1.5px stroke, round
 * caps and joins, `currentColor` only. <Icon> supplies the <svg> wrapper
 * (fill none / stroke currentColor), so each entry is just the geometry.
 * Shapes that need a fill opt in with fill="currentColor".
 */
export const icons = {
  analytics: (
    <>
      <path d="M4 4v16h16" />
      <path d="M8 15l3-4 3 2.5 5-6.5" />
    </>
  ),
  leaderboard: (
    <>
      <path d="M3 20h18" />
      <path d="M5 20v-8h4v8" />
      <path d="M10 20V5h4v15" />
      <path d="M15 20V9h4v11" />
    </>
  ),
  chat: <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />,
  settings: (
    <>
      <path d="M4 7h8" />
      <path d="M16 7h4" />
      <circle cx="14" cy="7" r="2" />
      <path d="M4 12h2" />
      <path d="M10 12h10" />
      <circle cx="8" cy="12" r="2" />
      <path d="M4 17h9" />
      <path d="M17 17h3" />
      <circle cx="15" cy="17" r="2" />
    </>
  ),
  contrast: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  'arrow-left': (
    <>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </>
  ),
  'arrow-down': (
    <>
      <path d="M12 5v14" />
      <path d="M6 13l6 6 6-6" />
    </>
  ),
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  'chevron-up': <path d="M6 15l6-6 6 6" />,
  'chevron-left': <path d="M15 6l-6 6 6 6" />,
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  send: (
    <>
      <path d="M21 3L10.5 13.5" />
      <path d="M21 3l-6.5 18-4-7.5L3 9.5 21 3z" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5h3l1.5-2.5h7L17 8.5h3a.5.5 0 0 1 .5.5V18a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  restart: (
    <>
      <path d="M18.5 15.75a7.5 7.5 0 1 1-1.68-9.5L20 9.5" />
      <path d="M20 4.5v5h-5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20v-.5a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20v-.5A5.5 5.5 0 0 1 8 14h2a5.5 5.5 0 0 1 5.5 5.5v.5" />
      <path d="M15.5 4.7a3.5 3.5 0 0 1 0 6.6" />
      <path d="M18 14.3a5.5 5.5 0 0 1 3.5 5.2v.5" />
    </>
  ),
  'user-plus': (
    <>
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M3 20v-.5A5.5 5.5 0 0 1 8.5 14h2a5.5 5.5 0 0 1 3.4 1.2" />
      <path d="M18 9v6M15 12h6" />
    </>
  ),
  'user-minus': (
    <>
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M3 20v-.5A5.5 5.5 0 0 1 8.5 14h2a5.5 5.5 0 0 1 3.4 1.2" />
      <path d="M15 12h6" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2" />
      <path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10" />
      <path d="M15 8l4 4-4 4" />
      <path d="M19 12H9.5" />
    </>
  ),
  expand: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4l-7 7" />
      <path d="M10 20H4v-6" />
      <path d="M4 20l7-7" />
    </>
  ),
  keycap: (
    <>
      <path d="M6 20h12a2.5 2.5 0 0 0 2.4-3.2l-2-8A2.5 2.5 0 0 0 16 7H8a2.5 2.5 0 0 0-2.4 1.8l-2 8A2.5 2.5 0 0 0 6 20z" />
      <path d="M7.5 13.5h9" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
      <path d="M4 4l16 16" />
    </>
  ),
  'alert-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" />
      <path d="M12 16.2v.01" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.8v.01" />
    </>
  ),
} as const;

export type IconName = keyof typeof icons;
