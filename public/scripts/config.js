const params = new URLSearchParams(window.location.search);
const workerParam = params.get('worker') || '';
const isLocalhost = window.location.hostname === 'localhost';

const readStoredWorkerUrl = () => {
  try {
    return window.localStorage.getItem('WORKER_URL') || '';
  } catch (e) {
    return '';
  }
};

const writeStoredWorkerUrl = (value) => {
  try {
    window.localStorage.setItem('WORKER_URL', value);
  } catch (e) {
  }
};

let workerUrl = '';
if (isLocalhost) {
  workerUrl = 'http://localhost:8787';
} else if (workerParam) {
  workerUrl = workerParam;
  writeStoredWorkerUrl(workerParam);
} else {
  workerUrl = readStoredWorkerUrl();
}

export const WORKER_URL = workerUrl;
