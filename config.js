// 配置：本地开发用 localhost，生产环境使用相对路径（Cloudflare Pages 同源）
export const WORKER_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8787'
  : ''; // 生产环境使用当前域名（Cloudflare Pages Functions）
