const learnerStorageKey = 'LEARNER_NAME';

const readStoredLearner = () => {
  try {
    return window.localStorage.getItem(learnerStorageKey) || '';
  } catch (e) {
    return '';
  }
};

const writeStoredLearner = (value) => {
  try {
    window.localStorage.setItem(learnerStorageKey, value);
  } catch (e) {
  }
};

const formatLearnerLabel = (value) => (value ? `当前：${value}` : '未设置');

const updateLearnerDisplay = (value) => {
  const display = document.getElementById('navLearnerDisplay');
  if (display) display.textContent = formatLearnerLabel(value);
};

export const getStoredLearnerName = () => readStoredLearner().trim();

export const focusLearnerInput = () => {
  const input = document.getElementById('navLearnerInput');
  if (input) input.focus();
};

export const ensureLearnerName = () => {
  const name = getStoredLearnerName();
  if (!name) {
    alert('请先填写学习者昵称');
    focusLearnerInput();
    return '';
  }
  return name;
};

const navBar = document.getElementById('navBar');
if (navBar) {
  const currentPage = document.body?.dataset?.page;
  const items = [
    { id: 'index', href: 'index.html', label: '输入' },
    { id: 'share', href: 'share.html', label: '分享' },
    { id: 'export', href: 'export.html', label: '复盘' }
  ];

  if (!navBar.querySelector('.nav-brand')) {
    const brand = document.createElement('div');
    brand.className = 'nav-brand';
    brand.textContent = '日语表达打磨系统';
    navBar.appendChild(brand);
  }

  const linkGroup = document.createElement('div');
  linkGroup.className = 'nav-links';

  items.forEach(item => {
    const link = document.createElement('a');
    link.href = item.href;
    link.className = `nav-link${item.id === currentPage ? ' active' : ''}`;
    link.textContent = item.label;
    linkGroup.appendChild(link);
  });

  const userGroup = document.createElement('div');
  userGroup.className = 'nav-user';

  const userIcon = document.createElement('span');
  userIcon.className = 'nav-user-icon';
  userIcon.textContent = '👤';

  const userInput = document.createElement('input');
  userInput.id = 'navLearnerInput';
  userInput.type = 'text';
  userInput.placeholder = '输入昵称';

  const storedLearner = readStoredLearner();
  if (storedLearner) userInput.value = storedLearner;

  const userDisplay = document.createElement('span');
  userDisplay.id = 'navLearnerDisplay';
  userDisplay.className = 'nav-user-display';
  userDisplay.textContent = formatLearnerLabel(storedLearner);

  userInput.addEventListener('input', () => {
    const value = userInput.value.trim();
    writeStoredLearner(value);
    updateLearnerDisplay(value);
  });

  userGroup.appendChild(userIcon);
  userGroup.appendChild(userInput);
  userGroup.appendChild(userDisplay);

  navBar.appendChild(linkGroup);
  navBar.appendChild(userGroup);
}
