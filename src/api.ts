export const HOUND_SERVER_URL = "http://127.0.0.1:8765";

export async function fetchServerInfo(): Promise<any> {
  const res = await fetch(`${HOUND_SERVER_URL}/info`);
  if (!res.ok) {
    throw new Error(`Failed to fetch /info: ${res.status}`);
  }
  return res.json();
}
