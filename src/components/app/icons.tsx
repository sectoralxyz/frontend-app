/* Quick-action icons for the accounts home. A plain module, so both the
   client page and server-rendered previews can use them. */

export const ICON = {
  send: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="square" />
    </svg>
  ),
  topup: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" strokeLinecap="square" />
    </svg>
  ),
  card: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
      <path d="M1.5 6.5h13" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M8 2.5v11M2.5 8h11" strokeLinecap="square" />
    </svg>
  ),
};
