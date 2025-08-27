export const HOUND_SERVER_URL = "http://127.0.0.1:8765";

export async function fetchServerInfo(): Promise<any> {
  const res = await fetch(`${HOUND_SERVER_URL}/info`);
  if (!res.ok) {
    throw new Error(`Failed to fetch /info: ${res.status}`);
  }
  return res.json();
}

export interface PixabayImage {
  id: number;
  previewURL: string;
  largeImageURL: string;
  tags: string;
}

export async function searchImages(query: string): Promise<PixabayImage[]> {
  const key =
    import.meta.env.VITE_PIXABAY_KEY ||
    "27844507-0c1f742675011cd3c5112d94ed"; // demo key with limited quota
  const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(
    query,
  )}&image_type=illustration&per_page=12&lang=en&category=computer`; // filter for tech icons
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to search images: ${res.status}`);
  }
  const data = await res.json();
  return data.hits.map((hit: any) => ({
    id: hit.id,
    previewURL: hit.previewURL,
    largeImageURL: hit.largeImageURL,
    tags: hit.tags,
  }));
}
