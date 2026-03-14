const navBar = document.getElementById('navBar');
if (navBar) {
  const currentPage = document.body?.dataset?.page;
  const items = [
    { id: 'index', href: 'index.html', label: '📝 输入' },
    { id: 'share', href: 'share.html', label: '🔍 分享' },
    { id: 'export', href: 'export.html', label: '📦 复盘' }
  ];
  items.forEach(item => {
    const link = document.createElement('a');
    link.href = item.href;
    link.className = `nav-link${item.id === currentPage ? ' active' : ''}`;
    link.textContent = item.label;
    navBar.appendChild(link);
  });
}
