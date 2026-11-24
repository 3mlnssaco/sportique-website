// Copy-address buttons on /contact/. The result is written next to the button that was pressed.
const english = document.documentElement.lang === 'en';
for (const button of document.querySelectorAll('[data-copy-email]')) {
  button.addEventListener('click', async () => {
    const status = button.closest('[data-copy-group]')?.querySelector('[data-copy-status]');
    // Clear first and write a moment later, so a repeated result is announced again.
    for (const other of document.querySelectorAll('[data-copy-status]')) other.textContent = '';
    let text;
    try {
      await navigator.clipboard.writeText(button.dataset.copyEmail);
      text = english ? 'Email address copied.' : '이메일 주소를 복사했습니다.';
    } catch {
      text = english ? 'Could not copy. Please copy the displayed address manually.' : '복사하지 못했습니다. 표시된 주소를 직접 복사해 주세요.';
    }
    if (status) setTimeout(() => { status.textContent = text; }, 50);
  });
}
