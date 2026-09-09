import { FORM_ENDPOINT } from './payload.js';

export async function sendAnswers(payload, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || '網路錯誤' };
  }
}
