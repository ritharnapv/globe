import React, { useState, useEffect } from "react";
import InteractiveGlobe from "./components/InteractiveGlobe";
import CountryDetails from "./components/CountryDetails";
import { CountryInspection } from "./types";
import {
  Globe,
  Search,
  History,
  RotateCcw,
  Sparkles,
  SearchCode,
  Map,
  Compass,
  AlertCircle,
  HelpCircle
} from "lucide-react";

const POPULAR_SEARCHES = [
  { name: "India", code: "IND", flag: "🇮🇳" },
  { name: "United States", code: "USA", flag: "🇺🇸" },
  { name: "Canada", code: "CAN", flag: "🇨🇦" },
  { name: "Australia", code: "AUS", flag: "🇦🇺" },
  { name: "Japan", code: "JPN", flag: "🇯🇵" },
  { name: "Germany", code: "DEU", flag: "🇩🇪" }
];

export default function App() {
  const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [inspectionData, setInspectionData] = useState<CountryInspection | null>(null);
  const [searchHistory, setSearchHistory] = useState<{name: string, code: string, flag: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("globe_postal_history");
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not retrieve search history from localStorage:", e);
    }
  }, []);

  // Inspect country details from Express server endpoint
  const inspectCountry = async (name: string, code: string) => {
    if (!name) return;
    
    setLoading(true);
    setError(null);
    setSelectedCountryName(name);
    setSelectedCountryCode(code);

    try {
      const response = await fetch("/api/countries/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryName: name, countryCode: code }),
      });

      if (!response.ok) {
        throw new Error(`Failed to query geography registry: ${response.statusText}`);
      }

      const data: CountryInspection = await response.json();
      setInspectionData(data);

      // Add to search history if not already present
      setSearchHistory((prev) => {
        const exists = prev.some((item) => item.name.toLowerCase() === name.toLowerCase());
        if (exists) return prev;
        
        const updated = [
          { name: data.countryName, code, flag: data.flagEmoji || "🏳️" },
          ...prev
        ].slice(0, 8); // Keep last 8 searches

        try {
          localStorage.setItem("globe_postal_history", JSON.stringify(updated));
        } catch (e) {
          console.warn("Could not write search history to localStorage:", e);
        }
        return updated;
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to retrieve postal details from server.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger search from custom input field
  const handleKeywordSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    inspectCountry(searchQuery.trim(), "");
    setSearchQuery("");
  };

  // Copy sample code directly into search widget
  const handleCopyPostalCodeToInput = (code: string) => {
    const inputElement = document.getElementById("postal-search-input") as HTMLInputElement;
    if (inputElement) {
      inputElement.value = code;
      // Focus on input
      inputElement.focus();
      // Dispatch change event to trigger state updates in subcomponent
      const event = new Event("input", { bubbles: true });
      inputElement.dispatchEvent(event);
      // Trigger search form submit
      const formElement = inputElement.closest("form");
      if (formElement) {
        formElement.requestSubmit();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e0e0e0] flex flex-col font-sans relative" id="app">
      {/* Decorative background grid and blurs conforming to Sophisticated Dark */}
      <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[140px]"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-[140px]"></div>
      </div>

      {/* Main navigation Header */}
      <header className="border-b border-white/10 bg-[#0d0d0f] sticky top-0 z-50 px-4 md:px-8 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-serif tracking-widest text-white uppercase">Geospatial</span>
            <div className="h-4 w-[1px] bg-white/20 hidden sm:block"></div>
            <div className="hidden sm:flex space-x-6 text-[10px] uppercase tracking-[0.2em] font-medium text-white/50">
              <span className="text-white">Postal Registry & Core Nodes</span>
            </div>
          </div>

          {/* Interactive Keyboard lookup input */}
          <form onSubmit={handleKeywordSearch} className="flex gap-2 w-full sm:w-auto" id="keyword-search-form">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                placeholder="SEARCH COORDINATES..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border border-white/10 text-[10px] text-white tracking-wider placeholder:text-white/30 pl-9 pr-3 py-2 rounded-none focus:outline-none focus:border-white/30 uppercase font-mono transition-colors"
                id="keyword-search-input"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 border border-white/10 hover:border-white/25 hover:bg-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-white transition-colors cursor-pointer rounded-none"
            >
              Analyze
            </button>
          </form>
        </div>
      </header>

      {/* Dashboard interactive body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 overflow-hidden">
        
        {/* Left Column: Interactive Globe stage (5 spans) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex-1 lg:min-h-[500px]">
            <InteractiveGlobe
              onSelectCountry={inspectCountry}
              selectedCountryName={selectedCountryName}
              loading={loading}
            />
          </div>

          {/* Rapid lookup shortcuts */}
          <div className="bg-[#0d0d0f] border border-white/10 p-5 rounded-none space-y-3 shadow-md">
            <span className="text-[9px] text-[#8e8e93] uppercase tracking-[0.25em] font-mono block font-bold">Geographical Shortcuts</span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((country) => (
                <button
                  key={country.code}
                  onClick={() => inspectCountry(country.name, country.code)}
                  className={`flex items-center space-x-2 px-3 py-1.5 border text-[10px] uppercase tracking-wider font-mono transition-all cursor-pointer rounded-none ${
                    selectedCountryName?.toLowerCase() === country.name.toLowerCase()
                      ? "bg-white text-black border-white font-bold font-mono"
                      : "bg-transparent hover:bg-white/5 border-white/10 hover:border-white/20 text-white/80"
                  }`}
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search History cache */}
          {searchHistory.length > 0 && (
            <div className="bg-[#0d0d0f] border border-white/10 p-5 rounded-none space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#8e8e93] uppercase tracking-[0.25em] font-mono flex items-center gap-1.5 font-bold">
                  <History className="w-3.5 h-3.5 text-white/40" /> Recent Inspections
                </span>
                <button
                  onClick={() => {
                    setSearchHistory([]);
                    localStorage.removeItem("globe_postal_history");
                  }}
                  className="text-[9px] uppercase tracking-wider font-mono text-white/50 hover:text-white flex items-center gap-1 bg-transparent py-1 px-2 border border-white/10 transition-colors"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Clear cache
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {searchHistory.map((item, idx) => (
                  <button
                    key={`${item.code}-${idx}`}
                    onClick={() => inspectCountry(item.name, item.code)}
                    className="flex items-center space-x-2 px-2.5 py-1.5 bg-white/5 border border-white/5 hover:border-white/20 text-[10px] uppercase tracking-wider font-mono text-white/75 hover:text-white transition-colors cursor-pointer rounded-none"
                  >
                    <span>{item.flag}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Information & lists panel (7 spans) */}
        <div className="lg:col-span-7 flex flex-col min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0d0d0f] border border-white/10 rounded-none text-center space-y-6 animate-pulse" id="loading-fallback">
              <div className="p-4 bg-white/5 border border-white/10 rounded-none text-white relative">
                <Compass className="w-10 h-10 animate-spin text-white/80" />
                <div className="absolute inset-0 rounded-none border border-white/10 animate-ping"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-serif uppercase tracking-widest text-white">Querying Geographical Registry</h3>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider max-w-sm mx-auto">
                  Acquiring administrative sub-divisions and verifying ZIP/PIN code rules for "{selectedCountryName}"...
                </p>
              </div>

              {/* Educational placeholder boxes */}
              <div className="w-full max-w-md p-4 bg-transparent border border-dashed border-white/10 rounded-none space-y-2 text-left text-xs">
                <div className="flex items-center gap-1.5 text-[9px] text-[#8e8e93] uppercase tracking-[0.25em] font-mono font-bold"><Sparkles className="w-3.5 h-3.5 text-white" /> Global Logistics Fact</div>
                <p className="text-white/50 leading-relaxed font-sans text-[11px] italic">
                  The Universal Postal Union regulates postal codes internationally. Different states coordinate standard prefix offsets to automate mail routing.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0d0d0f] border border-white/10 rounded-none text-center space-y-4" id="error-fallback">
              <div className="p-3 bg-white/5 text-white/50 border border-white/10 rounded-none">
                <AlertCircle className="w-6 h-6" />
               </div>
              <div className="space-y-2">
                <h3 className="text-xs uppercase tracking-[0.2em] font-serif text-white">Registry Out of Scope</h3>
                <p className="text-[11px] text-white/40 max-w-md font-sans">
                  The postal service database for "{selectedCountryName}" could not be resolved.
                </p>
                <div className="p-3.5 bg-red-500/5 border border-dashed border-red-500/20 max-w-md mx-auto text-left space-y-1 rounded-none">
                  <span className="text-[9px] text-[#ff4d4f] font-mono uppercase tracking-wider block font-bold">System details:</span>
                  <p className="text-[10px] text-white/60 font-mono break-words leading-relaxed">{error}</p>
                </div>
                {(error.toLowerCase().includes("key") || error.toLowerCase().includes("api") || error.toLowerCase().includes("auth") || error.toLowerCase().includes("fail")) && (
                  <p className="text-[9px] text-[#8e8e93] uppercase tracking-wider font-mono max-w-sm mx-auto pt-1">
                    Tip: Verify your <strong className="text-white">GEMINI_API_KEY</strong> in the <strong className="text-white">Settings &gt; Secrets</strong> tab of the dashboard.
                  </p>
                )}
              </div>
              <button
                onClick={() => selectedCountryName && inspectCountry(selectedCountryName, selectedCountryCode || "")}
                className="bg-transparent border border-white/20 hover:bg-white hover:text-black uppercase tracking-[0.2em] text-[9px] font-bold px-4 py-2 mt-2 rounded-none transition-colors cursor-pointer"
              >
                Retry Query
              </button>
            </div>
          ) : inspectionData ? (
            <div className="animate-fade-in">
              <CountryDetails
                data={inspectionData}
                onCopyPostalCode={handleCopyPostalCodeToInput}
              />
            </div>
          ) : (
            /* Onboarding View (No country selected yet) */
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0d0d0f] border border-white/10 rounded-none text-center space-y-8 animate-fade-in" id="onboarding-panel">
              <div className="max-w-md space-y-6">
                <div className="flex justify-center space-x-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-none text-white">
                    <Globe className="w-8 h-8 text-white/80 animate-spin-slow" />
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-none text-white/80">
                    <SearchCode className="w-8 h-8 text-white/80" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-serif text-white uppercase tracking-widest">
                    Geopolitical State Directory
                  </h3>
                  <p className="text-xs text-white/45 font-sans leading-relaxed">
                    Select any country on the cartographic sphere, search coordinates, or choose from our shortcuts list to inspect calling codes, regional borders, and postal syntax structures.
                  </p>
                </div>

                {/* Illustrated instructions checklist */}
                <div className="bg-transparent border border-dashed border-white/10 p-5 rounded-none text-left space-y-3.5 font-sans text-xs text-white/60">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 flex items-center justify-center bg-white/5 border border-white/15 text-[9px] text-white font-mono rounded-none shrink-0 mt-0.5">1</div>
                    <p className="text-[11px] font-medium">Click and drag inside the sphere stage to rotate the camera perspective.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 flex items-center justify-center bg-white/5 border border-white/15 text-[9px] text-white font-mono rounded-none shrink-0 mt-0.5">2</div>
                    <p className="text-[11px] font-medium">Click on highlighted territories to inspect official administrative regions datasets.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 flex items-center justify-center bg-white/5 border border-white/15 text-[9px] text-white font-mono rounded-none shrink-0 mt-0.5">3</div>
                    <p className="text-[11px] font-medium">Verify structural ZIP/PIN rules or look up location specific credentials on-the-fly.</p>
                  </div>
                </div>

                <div className="flex justify-center items-center gap-1.5 text-[9px] text-[#8e8e93] uppercase tracking-[0.2em] font-mono">
                  <HelpCircle className="w-4 h-4 text-white/40" /> SELECT A NODE POSITION TO EXPAND EXPLORER
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Main Footer credit */}
      <footer className="p-4 border-t border-white/10 bg-[#0d0d0f] text-white/30 text-center font-mono text-[9px] uppercase tracking-widest shrink-0">
        <p>© 2026 Geospatial Mapping & Postal Index Register • Powered by Gemini AI</p>
      </footer>
    </div>
  );
}
