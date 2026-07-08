export function refreshNotificationBadge() {
  window.dispatchEvent(new Event('realist:refresh-notifications'));
}
