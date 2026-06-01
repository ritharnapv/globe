import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { GeoJsonData, GeoJsonFeature } from "../types";
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Play, Pause, Globe, HelpCircle } from "lucide-react";

interface InteractiveGlobeProps {
  onSelectCountry: (name: string, code: string) => void;
  selectedCountryName: string | null;
  loading: boolean;
}

// Fallback list of countries in case the primary CDN GeoJSON fails to load or acts slowly
const FALLBACK_COUNTRIES = [
  { name: "United States", code: "USA", lat: 37, lon: -95 },
  { name: "India", code: "IND", lat: 20, lon: 78 },
  { name: "Canada", code: "CAN", lat: 56, lon: -106 },
  { name: "Australia", code: "AUS", lat: -25, lon: 133 },
  { name: "United Kingdom", code: "GBR", lat: 55, lon: -3 },
  { name: "Germany", code: "DEU", lat: 51, lon: 9 },
  { name: "Brazil", code: "BRA", lat: -14, lon: -51 },
  { name: "France", code: "FRA", lat: 46, lon: 2 },
  { name: "Japan", code: "JPN", lat: 36, lon: 138 },
  { name: "South Africa", code: "ZAF", lat: -30, lon: 25 },
  { name: "Russia", code: "RUS", lat: 61, lon: 105 },
  { name: "China", code: "CHN", lat: 35, lon: 104 },
  { name: "Italy", code: "ITA", lat: 41, lon: 12 },
  { name: "Spain", code: "ESP", lat: 40, lon: -3 },
  { name: "Mexico", code: "MEX", lat: 23, lon: -102 }
];

export default function InteractiveGlobe({
  onSelectCountry,
  selectedCountryName,
  loading
}: InteractiveGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dimensions state managed via ResizeObserver
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const [geoData, setGeoData] = useState<GeoJsonData | null>(null);
  const [fetchError, setFetchError] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);

  // Globe state
  const [rotation, setRotation] = useState<[number, number]>([-30, -20]); // [lambda (lon), phi (lat)]
  const [scale, setScale] = useState<number>(180);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [hoveredFeature, setHoveredFeature] = useState<GeoJsonFeature | null>(null);

  // Mouse interaction refs
  const isDraggingRef = useRef(false);
  const startMouseRef = useRef<[number, number]>([0, 0]);
  const startRotationRef = useRef<[number, number]>([0, 0]);
  const hasDraggedRef = useRef(false);

  // Adjust scale matching the dimensions with standard boundaries
  const currentScale = useMemo(() => {
    const minDim = Math.min(dimensions.width, dimensions.height);
    return Math.max(80, Math.min(scale, minDim * 0.48));
  }, [scale, dimensions]);

  // Handle Container resizing using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(300, width),
        height: Math.max(300, height)
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch world map GeoJSON on load
  useEffect(() => {
    let active = true;
    setIsFetching(true);
    fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Network status not positive");
        return res.json();
      })
      .then((data) => {
        if (active) {
          setGeoData(data);
          setIsFetching(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch world geojson. Activating fallback lists.", err);
        if (active) {
          setFetchError(true);
          setIsFetching(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoRotating || isDraggingRef.current || loading) return;

    let animId: number;
    const tick = () => {
      setRotation((prev) => [prev[0] + 0.35, prev[1]]);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isAutoRotating, loading]);

  // Configure target D3 projection
  const projection = useMemo(() => {
    return d3
      .geoOrthographic()
      .translate([dimensions.width / 2, dimensions.height / 2])
      .scale(currentScale)
      .rotate([rotation[0], rotation[1], 0])
      .clipAngle(90);
  }, [dimensions, currentScale, rotation]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  // Interactive Graticule lines
  const graticuleLines = useMemo(() => {
    return d3.geoGraticule().lines();
  }, []);

  // Set drag start coordinates
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Note: Do NOT call preventDefault here, so that click events still fire properly!
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    setIsAutoRotating(false); // Stop auto spinning upon interaction
    startMouseRef.current = [e.clientX, e.clientY];
    startRotationRef.current = [...rotation];
  };

  // Perform rotation coordinates shift when dragging
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startMouseRef.current[0];
    const dy = e.clientY - startMouseRef.current[1];
    
    // Check if the movement was actually a drag vs. a tiny tap/wobble
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq > 16) { // 4 pixels movement threshold
      if (!hasDraggedRef.current) {
        hasDraggedRef.current = true;
        try {
          (e.currentTarget as any).setPointerCapture(e.pointerId);
        } catch (err) {}
      }
    }

    if (hasDraggedRef.current) {
      // Smooth translation coordinates coefficient
      const sensitivity = 0.28; 
      const nextLambda = startRotationRef.current[0] + dx * sensitivity;
      const nextPhi = Math.max(-85, Math.min(85, startRotationRef.current[1] - dy * sensitivity));
      setRotation([nextLambda, nextPhi]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const isDrag = hasDraggedRef.current;
    isDraggingRef.current = false;
    hasDraggedRef.current = false;
    
    try {
      (e.currentTarget as any).releasePointerCapture(e.pointerId);
    } catch (err) {}

    // Failsafe manually targeted clicks in case standard onClick bubble gets hijacked or blocked
    if (!isDrag) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target && target instanceof SVGPathElement) {
        const countryName = target.getAttribute("data-country-name");
        const countryCode = target.getAttribute("data-country-code");
        if (countryName) {
          // Find clicked feature to animate centering camera rotation
          const found = geoData?.features.find(
            (f) => f.properties.name?.toLowerCase() === countryName.toLowerCase()
          );
          if (found) {
            const centroid = d3.geoCentroid(found as any);
            if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
              setRotation([-centroid[0], -centroid[1]]);
            }
          }
          setIsAutoRotating(false);
          onSelectCountry(countryName, countryCode || "");
        }
      }
    }
  };

  // Click on a country feature
  const handleCountryClick = (feature: GeoJsonFeature, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Stop rotating
    setIsAutoRotating(false);

    // Estimate geographical center for camera rotation focus transition
    // d3.geoCentroid returns longitude, latitude
    const centroid = d3.geoCentroid(feature as any);
    if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
      // Transition globe view to face selected country
      setRotation([-centroid[0], -centroid[1]]);
    }

    const countryName = feature.properties.name;
    const countryCode = (feature.id || "").toString();
    onSelectCountry(countryName, countryCode);
  };

  // Select fallback country directly if globe CDN is blocked
  const handleFallbackClick = (country: typeof FALLBACK_COUNTRIES[0]) => {
    setIsAutoRotating(false);
    setRotation([-country.lon, -country.lat]);
    onSelectCountry(country.name, country.code);
  };

  // Zoom helpers
  const zoomIn = () => setScale((prev) => Math.min(500, prev + 30));
  const zoomOut = () => setScale((prev) => Math.max(60, prev - 30));

  // Render variables
  const gridPath = graticuleLines ? pathGenerator(graticuleLines) : null;
  const globeOutlineGeoJson = { type: 'Sphere' } as any;
  const backOutlinePath = pathGenerator(globeOutlineGeoJson);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0f] rounded-none border border-white/10 overflow-hidden relative" id="globe-panel">
      {/* Sophisticated Dark background styling overlay instead of basic stars */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,rgba(0,0,0,1)_100%)]"></div>

      {/* Header bar within Globe */}
      <div className="z-10 flex items-center justify-between p-4 bg-[#0d0d0f]/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-white/70" />
          <div>
            <h3 className="text-xs font-serif uppercase tracking-[0.2em] text-white">Interactive Cartographic Sphere</h3>
            <p className="text-[9px] text-[#8e8e93] uppercase tracking-wider font-mono">Rotate, click any nation path, explore regions</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 p-1 bg-white/5 border border-white/10 rounded-none">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-1.5 transition-all text-xs uppercase tracking-widest ${
              isAutoRotating ? "bg-white text-black font-semibold" : "text-white/60 hover:text-white"
            }`}
            title={isAutoRotating ? "Pause rotation" : "Auto rotate globe"}
            id="btn-auto-rotate"
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <div className="h-4 w-[1px] bg-white/15"></div>
          <button
            onClick={zoomIn}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 transition-all"
            title="Zoom In"
            id="btn-zoom-in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomOut}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 transition-all"
            title="Zoom Out"
            id="btn-zoom-out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary interactive map area */}
      <div 
        ref={containerRef} 
        className="flex-1 min-h-[300px] flex items-center justify-center relative cursor-grab active:cursor-grabbing select-none"
        id="globe-stage"
      >
        {isFetching && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0b]/90 z-20 space-y-3">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
            <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-mono">Syncing geopolitical geometries...</p>
          </div>
        )}

        {fetchError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0a0a0b]/95 z-20 text-center space-y-4">
            <div className="p-3 bg-white/5 text-white/80 rounded-none border border-white/10">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-serif text-white">Boundary Sync Postponed</h4>
              <p className="text-[11px] text-white/40 mt-2 max-w-sm font-sans">
                Direct vector maps are currently loading slowly. Click any core hub node below to explore its entire sub-divisions catalog!
              </p>
            </div>
            
            {/* Elegant fallbacks scroll */}
            <div className="w-full max-w-md max-h-[160px] overflow-y-auto custom-scrollbar border border-white/10 rounded-none bg-black/40 p-2 text-left">
              <span className="text-[9px] uppercase tracking-[0.25em] font-mono text-white/40 px-2 block mb-2">Core Registry Nodes</span>
              <div className="grid grid-cols-2 gap-1.5">
                {FALLBACK_COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleFallbackClick(c)}
                    className={`flex items-center text-left space-x-2 p-2 rounded-none border text-xs transition-all ${
                      selectedCountryName === c.name 
                        ? "bg-white text-black border-white" 
                        : "bg-transparent border-white/10 hover:border-white/30 text-white/70"
                    }`}
                  >
                    <span>🌐</span>
                    <span className="truncate font-mono text-[10px] uppercase tracking-wider">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Country Hover Tooltip */}
        {hoveredFeature && !isDraggingRef.current && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-[#0a0a0b]/95 border border-white/15 rounded-none shadow-xl pointer-events-none backdrop-blur-md animate-fade-in">
            <span className="text-[9px] text-[#8e8e93] uppercase tracking-[0.2em] font-mono block">Geopolitical Sector</span>
            <span className="text-xs font-serif text-white tracking-wide">{hoveredFeature.properties.name}</span>
          </div>
        )}

        {/* SVG Drawing Canvas */}
        {!isFetching && !fetchError && geoData && (
          <svg
            width={dimensions.width}
            height={dimensions.height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full h-full prevent-select select-none"
            id="globe-canvas"
          >
            <defs>
              {/* Globe radial shadows and atmosphere effects matching Sophisticated Dark */}
              <radialGradient id="globeShadow" cx="50%" cy="50%" r="50%">
                <stop offset="70%" stopColor="#0d0d0f" stopOpacity="0" />
                <stop offset="90%" stopColor="#050507" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#020203" stopOpacity="0.95" />
              </radialGradient>
              <radialGradient id="earthGlow" cx="50%" cy="50%" r="50%">
                <stop offset="85%" stopColor="#0d0d0f" stopOpacity="0" />
                <stop offset="96%" stopColor="#3b82f6" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.22" />
              </radialGradient>
            </defs>

            {/* Earth Glowing back sphere */}
            {backOutlinePath && (
              <path
                d={backOutlinePath}
                className="fill-[#090b0e] stroke-none"
                id="globe-bg-sphere"
              />
            )}

            {/* Graticule grid structures (Lines of Latitudes/Longitudes) */}
            {gridPath && (
              <path
                d={gridPath}
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="0.5"
                className="pointer-events-none"
                id="graticule"
              />
            )}

            {/* Vector polygons of World Countries */}
            <g id="countries-group">
              {geoData.features.map((feature, idx) => {
                const pathStr = pathGenerator(feature);
                if (!pathStr) return null;

                const isSelected = selectedCountryName && feature.properties.name &&
                  selectedCountryName.toLowerCase() === feature.properties.name.toLowerCase();
                const isHovered = hoveredFeature && hoveredFeature.properties.name === feature.properties.name;

                return (
                  <path
                    key={idx}
                    d={pathStr}
                    data-country-name={feature.properties.name}
                    data-country-code={(feature.id || "").toString()}
                    onClick={(e) => handleCountryClick(feature as any, e)}
                    onMouseEnter={() => setHoveredFeature(feature as any)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    className={`transition-all duration-150 stroke-[#0a0a0b] stroke-width-[0.3px] cursor-pointer outline-none ${
                      isSelected
                        ? "fill-white stroke-white stroke-[0.8px] drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                        : isHovered
                        ? "fill-blue-500/25 stroke-blue-400 stroke-[0.5px]"
                        : "fill-white/10 hover:fill-white/20"
                    }`}
                    style={{ transition: 'fill 150ms ease, stroke 150ms ease' }}
                  />
                );
              })}
            </g>

            {/* Shadow overlay to make it look 3D sphere */}
            {backOutlinePath && (
              <path
                d={backOutlinePath}
                fill="url(#globeShadow)"
                className="pointer-events-none"
              />
            )}
            
            {/* Atmospheric Outer Ring glow */}
            {backOutlinePath && (
              <path
                d={backOutlinePath}
                fill="url(#earthGlow)"
                className="pointer-events-none"
              />
            )}
          </svg>
        )}
      </div>

      {/* Helpful Instructions Overlay Footer */}
      <div className="p-3 bg-[#0d0d0f] border-t border-white/10 text-[10px] text-white/50 uppercase tracking-widest flex items-center justify-between font-mono shrink-0">
        <span className="flex items-center space-x-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-none bg-white/40 animate-pulse"></span>
          <span>Click and drag globe. Click any country path to load datasets.</span>
        </span>
        {selectedCountryName && (
          <span className="text-[9px] text-white px-2 py-0.5 rounded-none bg-white/10 border border-white/20">
            Node: {selectedCountryName}
          </span>
        )}
      </div>
    </div>
  );
}
