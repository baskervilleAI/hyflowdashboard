export const HOUND_SERVER_URL = "http://127.0.0.1:8765";

export async function fetchServerInfo(): Promise<any> {
  const res = await fetch(`${HOUND_SERVER_URL}/info`);
  if (!res.ok) {
    throw new Error(`Failed to fetch /info: ${res.status}`);
  }
  return res.json();
}

export interface ImageResult {
  id: string;
  previewURL: string;
  largeImageURL: string;
  tags: string;
}

// Searches public Flickr images by tag. This endpoint is free and requires no API key.
export async function searchImages(query: string): Promise<ImageResult[]> {
  const url =
    "https://www.flickr.com/services/feeds/photos_public.gne" +
    `?format=json&nojsoncallback=1&tags=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to search images: ${res.status}`);
  }
  const data = await res.json();
  return data.items.map((item: any, idx: number) => ({
    id: item.link || String(idx),
    previewURL: item.media.m,
    largeImageURL: item.media.m.replace("_m.", "_b."),
    tags: item.title,
  }));
}
