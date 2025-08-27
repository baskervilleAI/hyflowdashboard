import React, { useState } from "react";
import { searchImages, PixabayImage } from "../api";

type ImageSearchProps = {
  onSelect: (url: string, label: string) => void;
};

const ImageSearch: React.FC<ImageSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PixabayImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const imgs = await searchImages(query);
      setResults(imgs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-search-panel">
      <form onSubmit={handleSearch} className="row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar imagen..."
        />
        <button type="submit" disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      <div className="image-results">
        {results.map((img) => (
          <img
            key={img.id}
            src={img.previewURL}
            alt={img.tags}
            onClick={() => onSelect(img.largeImageURL, img.tags)}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSearch;
