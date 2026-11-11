const apiBaseUrl = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

export async function apiRequest(path, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      'Could not reach the StudySync API. Check that the server is running.',
    );
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validationMessage = result.errors
      ?.map((item) => item.message)
      .join(', ');
    const error = new Error(
      validationMessage || result.message || 'The request failed.',
    );
    error.status = response.status;
    throw error;
  }

  return result;
}
