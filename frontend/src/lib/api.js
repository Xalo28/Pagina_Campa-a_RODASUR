// Cliente HTTP hacia el API de Express + utilidades de sesión/formato.
const TOKEN_KEY = 'rodasur_token';
const USER_KEY = 'rodasur_user';

export const auth = {
  token: () => localStorage.getItem(TOKEN_KEY),
  user: () => localStorage.getItem(USER_KEY),
  isLogged: () => !!localStorage.getItem(TOKEN_KEY),
  save: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, user);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = auth.token();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(path, { ...options, headers });
  if (res.status === 401 && token) auth.clear();

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error en la operación.');
  return data;
}

export const money = (n) =>
  '$ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
