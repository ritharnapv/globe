import React, { useState } from "react";
import { CountryInspection, StateInfo } from "../types";
import {
  Globe2,
  Users,
  BadgeDollarSign,
  Languages,
  Phone,
  Compass,
  Search,
  BookOpen,
  Map,
  Copy,
  ChevronDown,
  ChevronUp,
  Inbox
} from "lucide-react";
import PostalSearch from "./PostalSearch";

interface CountryDetailsProps {
  data: CountryInspection;
  onCopyPostalCode: (code: string) => void;
}

export default function CountryDetails({ data, onCopyPostalCode }: CountryDetailsProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [expandedState, setExpandedState] = useState<string | null>(null);

  // States filter computation
  const filteredStates = data.states.filter((state) => {
    const q = filterQuery.toLowerCase();
    return (
      state.name.toLowerCase().includes(q) ||
      state.code.toLowerCase().includes(q) ||
      state.capitalOrHq.toLowerCase().includes(q)
    );
  });

  const toggleStateExpand = (stateName: string) => {
    setExpandedState(expandedState === stateName ? null : stateName);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="country-details-panel">
      {/* Country Hero Header Info */}
      <div className="bg-[#0d0d0f] border border-white/10 rounded-none p-6 relative overflow-hidden shadow-lg">
        {/* Flag background watermark */}
        <div className="absolute right-4 top-4 text-7xl select-none opacity-[0.05]">
          {data.flagEmoji}
        </div>

        <header className="mb-6">
          <span className="text-[10px] text-[#8e8e93] uppercase tracking-[0.3em] font-medium block">Active Selection</span>
          <div className="flex items-center space-x-3 mt-2">
            <span className="text-3xl">{data.flagEmoji || "🏳️"}</span>
            <div>
              <h2 className="text-3xl font-serif text-white tracking-wide leading-none">{data.countryName}</h2>
              <p className="text-[11px] text-white/40 italic mt-1 leading-none">
                {data.postalCodeLabel || "Postal Code"} Zone Directory
              </p>
            </div>
          </div>
        </header>

        {/* General Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/5 hover:border-white/20 p-3 rounded-none flex items-center space-x-3 transition-colors">
            <Globe2 className="w-4 h-4 text-white/50" />
            <div className="min-w-0">
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono block">Capital</span>
              <span className="text-xs font-semibold text-white truncate block">{data.capital}</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 hover:border-white/20 p-3 rounded-none flex items-center space-x-3 transition-colors">
            <Users className="w-4 h-4 text-white/50" />
            <div className="min-w-0">
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono block">Population</span>
              <span className="text-xs font-semibold text-white truncate block">{data.population}</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 hover:border-white/20 p-3 rounded-none flex items-center space-x-3 transition-colors">
            <BadgeDollarSign className="w-4 h-4 text-white/50" />
            <div className="min-w-0">
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono block">Currency</span>
              <span className="text-xs font-semibold text-white truncate block">{data.currency}</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 hover:border-white/20 p-3 rounded-none flex items-center space-x-3 transition-colors">
            <Languages className="w-4 h-4 text-white/50" />
            <div className="min-w-0">
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono block">Languages</span>
              <span className="text-xs font-semibold text-white truncate block">{data.language}</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 hover:border-white/20 p-3 rounded-none flex items-center space-x-3 transition-colors">
            <Phone className="w-4 h-4 text-white/50" />
            <div className="min-w-0">
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono block">Dial Code</span>
              <span className="text-xs font-semibold text-white truncate block">{data.phoneCode}</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 hover:border-white/20 p-3 rounded-none flex items-center space-x-3 transition-colors">
            <Compass className="w-4 h-4 text-white/50" />
            <div className="min-w-0">
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono block">Registry Standard</span>
              <span className="text-xs font-semibold text-white truncate block font-mono">
                {data.postalCodeLabel || "Standard"}
              </span>
            </div>
          </div>
        </div>

        {/* Global Format Detail Line */}
        <div className="mt-4 p-4.5 bg-black/40 border border-white/15 rounded-none flex flex-col md:flex-row justify-between text-xs gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#8e8e93] font-mono font-bold">Format Structure</span>
            <span className="text-white mt-1.5 font-mono text-[11px] uppercase tracking-wider">{data.postalCodeFormat || "VARIES"}</span>
          </div>
          {data.postalCodeRegexExplanation && (
            <div className="flex flex-col md:text-right">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#8e8e93] font-mono font-bold">Syntax Restriction Rule</span>
              <span className="text-white/60 mt-1.5 font-sans leading-relaxed text-[11px]">{data.postalCodeRegexExplanation}</span>
            </div>
          )}
        </div>
      </div>

      {/* Postal/PIN Code Interactive validation module */}
      <PostalSearch
        countryName={data.countryName}
        postalCodeLabel={data.postalCodeLabel}
        onSearchResultLocation={(lat, lon) => {
          // coordinate handler
        }}
      />

      {/* States & Regions directory listing */}
      <div className="bg-[#0d0d0f] border border-white/10 rounded-none p-6 shadow-lg space-y-5" id="states-directory">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <Map className="w-4 h-4 text-white/60" />
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-serif text-white">Administrative Divisions</h3>
              <p className="text-[9px] text-[#8e8e93] uppercase tracking-wider font-mono">Subdivisions and sample {data.postalCodeLabel || "PIN Code"}s</p>
            </div>
          </div>
          
          {/* Quick Search bar for States list */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="FILTER SUBDIVISIONS..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="bg-transparent border border-white/10 text-white placeholder:text-white/30 text-[10px] rounded-none pl-8 pr-3 py-2 w-full md:w-52 focus:outline-none focus:border-white/30 font-mono tracking-wider uppercase"
              id="filter-states-input"
            />
          </div>
        </div>

        {filteredStates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-transparent border border-dashed border-white/10 rounded-none text-center text-white/40 text-xs">
            <Inbox className="w-6 h-6 text-white/20 mb-2" />
            <p className="uppercase tracking-widest font-mono text-[9px]">No matching subdivisions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-1" id="states-map-grid">
            {filteredStates.map((state) => {
              const isExpanded = expandedState === state.name;
              return (
                <div
                  key={state.name}
                  className={`bg-transparent border transition-all rounded-none ${
                    isExpanded ? "border-white/30 bg-white/5" : "border-white/5 hover:border-white/15"
                  }`}
                  id={`state-card-${state.code}`}
                >
                  {/* Collapsed view header */}
                  <div
                    onClick={() => toggleStateExpand(state.name)}
                    className="flex justify-between items-center p-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-3.5 truncate">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-white/10 border border-white/15 text-white shrink-0 rounded-none uppercase">
                        {state.code || "N/A"}
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-serif text-white block truncate leading-none">
                          {state.name}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono tracking-wide block truncate mt-1">
                          HQ: {state.capitalOrHq}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-white/60" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                    )}
                  </div>

                  {/* Expanded detail space */}
                  {isExpanded && (
                    <div className="p-4 bg-black/30 border-t border-white/10 space-y-4 animate-slide-down">
                      {/* Description */}
                      <p className="text-[11px] text-white/70 leading-relaxed font-sans">{state.description}</p>

                      {/* Typical Pincodes lookup row */}
                      <div className="bg-[#0a0a0b]/60 border border-white/10 p-3.5 rounded-none space-y-2.5">
                        <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-[#8e8e93]">
                          <span>Sample Postal Nodes</span>
                          <span className="text-[8px] text-white/40 italic font-sans flex items-center gap-1 uppercase tracking-widest normal-case">
                            <span className="inline-block w-1 h-1 bg-white/50 animate-pulse"></span> Click code to query entry
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {state.typicalPincodes && state.typicalPincodes.length > 0 ? (
                            state.typicalPincodes.map((code) => (
                              <button
                                key={code}
                                onClick={() => onCopyPostalCode(code)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white text-white hover:text-black hover:border-white border border-white/15 rounded-none text-[10px] font-bold font-mono tracking-wider transition-all cursor-pointer"
                                title={`Query system for code: ${code}`}
                              >
                                <span>{code}</span>
                                <Copy className="w-3 h-3 opacity-60 shrink-0" />
                              </button>
                            ))
                          ) : (
                            <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">No sample codes declared</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* General Postal History/Trivia */}
      {data.generalPostalTrivia && (
        <div className="bg-transparent border border-dashed border-white/10 p-5 rounded-none text-xs flex gap-3.5 leading-relaxed text-white/50 shadow-inner">
          <BookOpen className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
          <div>
            <span className="text-[9px] text-[#8e8e93] tracking-[0.2em] font-bold uppercase block mb-1">Postal History Context</span>
            <span className="font-sans text-[11px] text-white/60 leading-relaxed font-normal">{data.generalPostalTrivia}</span>
          </div>
        </div>
      )}
    </div>
  );
}
