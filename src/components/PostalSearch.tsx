import React, { useState } from "react";
import { Search, MapPin, Loader2, Compass, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { PostalLookup } from "../types";

interface PostalSearchProps {
  countryName: string;
  postalCodeLabel: string;
  onSearchResultLocation?: (lat: number, lon: number) => void;
}

export default function PostalSearch({
  countryName,
  postalCodeLabel,
  onSearchResultLocation
}: PostalSearchProps) {
  const [queryCode, setQueryCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PostalLookup | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryCode.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/postal/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryName,
          code: queryCode.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to search postal registry database.");
      }

      const data: PostalLookup = await response.json();
      setResult(data);

      if (data.isValid && onSearchResultLocation) {
        onSearchResultLocation(data.latitude, data.longitude);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An issue occurred querying the postal database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0d0d0f] border border-white/10 rounded-none p-5 shadow-lg" id="postal-search-widget">
      <div className="flex items-center space-x-2.5 mb-4">
        <MapPin className="w-4 h-4 text-white/60" />
        <h4 className="text-xs uppercase tracking-[0.2em] font-serif text-white">
          Verify {postalCodeLabel || "Postal Code"} inside {countryName}
        </h4>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={queryCode}
            onChange={(e) => setQueryCode(e.target.value)}
            placeholder={`ENTER ${postalCodeLabel ? postalCodeLabel.toUpperCase() : "PIN CODE"} (e.g. 90210)...`}
            className="w-full bg-transparent border border-white/10 rounded-none px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 font-mono tracking-wider uppercase transition-colors"
            required
            disabled={loading}
            id="postal-search-input"
          />
        </div>
        <button
          type="submit"
          className="bg-white hover:bg-white/90 disabled:bg-white/10 text-black disabled:text-white/30 font-mono font-bold text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 rounded-none flex items-center gap-2 transition-all cursor-pointer"
          disabled={loading || !queryCode.trim()}
          id="postal-search-submit"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <span>Query</span>
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-500/5 border border-dashed border-red-500/25 rounded-none text-xs text-red-400 font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Lookup results */}
      {result && (
        <div className="mt-4 p-4 bg-black/40 border border-white/10 rounded-none space-y-4 animate-fade-in" id="postal-lookup-results">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white">
              <span className="text-[9px] text-[#8e8e93] uppercase tracking-widest leading-none">Target Code:</span>
              <span className="font-mono text-white underline decoration-dotted leading-none">{result.postalCode}</span>
            </div>
            {result.isValid ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-none text-[8px] font-bold font-mono uppercase bg-white/10 border border-white/20 text-white">
                <CheckCircle2 className="w-3 h-3 text-white" /> Valid Location
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-none text-[8px] font-bold font-mono uppercase bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertTriangle className="w-3 h-3 text-red-500" /> Syntax Ambiguous
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 border border-white/15 p-3 rounded-none">
              <span className="text-[9px] text-[#8e8e93] uppercase tracking-[0.2em] font-mono block">State / Province</span>
              <span className="font-serif text-white truncate block mt-1">{result.state || "N/A"}</span>
            </div>
            <div className="bg-white/5 border border-white/15 p-3 rounded-none">
              <span className="text-[9px] text-[#8e8e93] uppercase tracking-[0.2em] font-mono block">City / HQ</span>
              <span className="font-serif text-white truncate block mt-1">{result.city || "N/A"}</span>
            </div>
            <div className="col-span-2 bg-white/5 border border-white/15 p-3 rounded-none">
              <span className="text-[9px] text-[#8e8e93] uppercase tracking-[0.2em] font-mono block">Sub-district / Division Sector</span>
              <span className="font-serif text-white truncate block mt-1">{result.district || "N/A"}</span>
            </div>
          </div>

          {/* Coordinates indicator */}
          {(result.latitude !== undefined && result.longitude !== undefined) && (
            <div className="flex items-center justify-between text-[10px] font-mono p-3 bg-transparent rounded-none border border-dashed border-white/10 text-white/50">
              <span className="flex items-center gap-1.5 uppercase tracking-widest">
                <Compass className="w-3.5 h-3.5 text-white/50 animate-spin-slow" /> Coordinates:
              </span>
              <span className="text-white">
                Lat: {result.latitude.toFixed(4)}° N, Lon: {result.longitude.toFixed(4)}° E
              </span>
            </div>
          )}

          {/* Detailed contextual description */}
          {result.description && (
            <div className="bg-[#0a0a0b]/60 border border-white/5 p-3 rounded-none text-[11px] leading-relaxed text-white/60 font-sans">
              <p className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-white/40 shrink-0 mt-0.5" />
                <span>{result.description}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
