async function request(path, options) {
  let response;
  try { response = await fetch(path, options); }
  catch { throw new Error('Cannot reach the local API server. Start the app with npm run dev.'); }
  let data;
  try { data = await response.json(); }
  catch { throw new Error('The local API server is unavailable. Start the app with npm run dev.'); }
  if (!response.ok) {
    const error = new Error(data.error?.message || 'The generation request failed.');
    error.status = response.status;
    error.retryAt = data.error?.retryAt || 0;
    throw error;
  }
  return data;
}
export const getGenerationStatus = () => request('/api/status');
export const getGeneration = id => request(`/api/generations/${encodeURIComponent(id)}`);
export const generateProfileImages = ({ agent, interpretation, prompt, requestId }) => request('/api/generations', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent, interpretation, prompt, requestId }),
});
export const resumeGeneration = id => request(`/api/generations/${encodeURIComponent(id)}/resume`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
});
