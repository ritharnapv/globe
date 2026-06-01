import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// ES module path resolution compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Load local database of countries and postal codes
const databasePath = path.join(__dirname, "data", "geodb.json");
let geoDatabase: any = { countries: {}, samplePostalCodes: {} };
try {
  if (fs.existsSync(databasePath)) {
    geoDatabase = JSON.parse(fs.readFileSync(databasePath, "utf-8"));
  } else {
    // Failsafe in case of path differences
    const rootPath = path.join(process.cwd(), "data", "geodb.json");
    if (fs.existsSync(rootPath)) {
      geoDatabase = JSON.parse(fs.readFileSync(rootPath, "utf-8"));
    }
  }
} catch (err) {
  console.error("Failed to load geospatial database:", err);
}

// Centroid coordinates mapping for popular countries (used as fallback coordinates)
const FALLBACK_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "india": { lat: 20.5937, lon: 78.9629 },
  "united states": { lat: 37.0902, lon: -95.7129 },
  "canada": { lat: 56.1304, lon: -106.3468 },
  "australia": { lat: -25.2744, lon: 133.7751 },
  "united kingdom": { lat: 55.3781, lon: -3.4360 },
  "germany": { lat: 51.1657, lon: 10.4515 },
  "brazil": { lat: -14.2350, lon: -51.9253 },
  "france": { lat: 46.2276, lon: 2.2137 },
  "japan": { lat: 36.2048, lon: 138.2529 },
  "south africa": { lat: -30.5595, lon: 22.9375 },
  "russia": { lat: 61.5240, lon: 105.3188 },
  "china": { lat: 35.8617, lon: 104.1954 },
  "italy": { lat: 41.8719, lon: 12.5674 },
  "spain": { lat: 40.4637, lon: -3.7492 },
  "mexico": { lat: 23.6345, lon: -102.5528 }
};

function getFallbackCoordinates(country: string) {
  return FALLBACK_COORDINATES[country] || { lat: 0, lon: 0 };
}

// Rule-based postal code resolver for dynamic mock lookups
function resolvePostalCodeOffline(countryName: string, code: string) {
  const normalizedCountry = countryName.trim().toLowerCase();
  const cleanCode = code.trim().toUpperCase();

  // 1. Try exact match from predefined samples first
  if (geoDatabase.samplePostalCodes?.[normalizedCountry]?.[cleanCode]) {
    return geoDatabase.samplePostalCodes[normalizedCountry][cleanCode];
  }

  // 2. Rule-based parsers for key countries
  if (normalizedCountry === "india") {
    const firstDigit = cleanCode.charAt(0);
    switch (firstDigit) {
      case "1":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "India",
          state: "Delhi",
          city: "New Delhi",
          district: "Central Delhi Division",
          latitude: 28.6139,
          longitude: 77.2090,
          description: `An Indian PIN code in Zone 1 (Northern Region), covering Delhi and surrounding sectors.`
        };
      case "2":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "India",
          state: "Uttar Pradesh",
          city: "Lucknow",
          district: "Hazratganj",
          latitude: 26.8467,
          longitude: 80.9462,
          description: `An Indian PIN code in Zone 2 (Northern Region - Uttar Pradesh & Uttarakhand), serving major northern plain sectors.`
        };
      case "3":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "India",
          state: "Gujarat",
          city: "Ahmedabad",
          district: "Navrangpura District",
          latitude: 23.0225,
          longitude: 72.5714,
          description: `An Indian PIN code in Zone 3 (Western Region - Gujarat & Rajasthan), representing major commercial corridors.`
        };
      case "4":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "India",
          state: "Maharashtra",
          city: "Pune",
          district: "Shivajinagar Division",
          latitude: 18.5204,
          longitude: 73.8567,
          description: `An Indian PIN code in Zone 4 (Western/Central Region - Maharashtra, Goa, MP), representing major industrial and cultural sectors.`
        };
      case "5":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "India",
          state: "Karnataka",
          city: "Bengaluru",
          district: "Indiranagar Post Office",
          latitude: 12.9784,
          longitude: 77.6408,
          description: `An Indian PIN code in Zone 5 (Southern Region - Karnataka & Andhra Pradesh), serving key technological and research hubs.`
        };
      case "6":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "India",
          state: "Tamil Nadu",
          city: "Chennai",
          district: "Adyar Sector",
          latitude: 13.0012,
          longitude: 80.2565,
          description: `An Indian PIN code in Zone 6 (Southern Region - Tamil Nadu & Kerala), covering southern coastal regions.`
        };
      case "7":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "India",
          state: "West Bengal",
          city: "Kolkata",
          district: "Salt Lake Sector V",
          latitude: 22.5726,
          longitude: 88.4346,
          description: `An Indian PIN code in Zone 7 (Eastern Region), covering West Bengal, Odisha, and northeastern states.`
        };
      case "8":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "India",
          state: "Bihar",
          city: "Patna",
          district: "Kankarbagh Division",
          latitude: 25.5941,
          longitude: 85.1376,
          description: `An Indian PIN code in Zone 8 (Eastern Region - Bihar & Jharkhand), serving plains and economic sectors.`
        };
      default:
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "India",
          state: "Karnataka",
          city: "Bengaluru",
          district: "General Post Office (Failsafe)",
          latitude: 12.9716,
          longitude: 77.5946,
          description: `An Indian PIN code resolved to the general headquarters region.`
        };
    }
  }

  if (normalizedCountry === "united states") {
    const firstDigit = cleanCode.charAt(0);
    switch (firstDigit) {
      case "0":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "United States",
          state: "Massachusetts",
          city: "Boston",
          district: "Suffolk County",
          latitude: 42.3601,
          longitude: -71.0589,
          description: `A US ZIP code in Area 0, serving the historic New England region.`
        };
      case "1":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "United States",
          state: "New York",
          city: "New York City",
          district: "Manhattan Division",
          latitude: 40.7128,
          longitude: -74.0060,
          description: `A US ZIP code in Area 1, serving New York and Pennsylvania.`
        };
      case "2":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "United States",
          state: "Virginia",
          city: "Richmond",
          district: "Henrico County",
          latitude: 37.5407,
          longitude: -77.4360,
          description: `A US ZIP code in Area 2, serving the Mid-Atlantic states.`
        };
      case "3":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "United States",
          state: "Florida",
          city: "Orlando",
          district: "Orange County",
          latitude: 28.5383,
          longitude: -81.3792,
          description: `A US ZIP code in Area 3, serving the southeastern states and holiday hubs.`
        };
      case "4":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "United States",
          state: "Michigan",
          city: "Detroit",
          district: "Wayne County",
          latitude: 42.3314,
          longitude: -83.0458,
          description: `A US ZIP code in Area 4, serving the industrial Great Lakes states.`
        };
      case "5":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "United States",
          state: "Minnesota",
          city: "Minneapolis",
          district: "Hennepin County",
          latitude: 44.9778,
          longitude: -93.2650,
          description: `A US ZIP code in Area 5, serving the northern plains and midwest grain belts.`
        };
      case "6":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "United States",
          state: "Illinois",
          city: "Chicago",
          district: "Cook County",
          latitude: 41.8781,
          longitude: -87.6298,
          description: `A US ZIP code in Area 6, covering the central midwest states and Chicago suburbs.`
        };
      case "7":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "United States",
          state: "Texas",
          city: "Houston",
          district: "Harris County",
          latitude: 29.7604,
          longitude: -95.3698,
          description: `A US ZIP code in Area 7, serving the south-central states of Texas, Louisiana, and Oklahoma.`
        };
      case "8":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "United States",
          state: "Colorado",
          city: "Denver",
          district: "Denver County",
          latitude: 39.7392,
          longitude: -104.9903,
          description: `A US ZIP code in Area 8, serving the Mountain West region.`
        };
      case "9":
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "United States",
          state: "California",
          city: "San Francisco",
          district: "San Francisco County",
          latitude: 37.7749,
          longitude: -122.4194,
          description: `A US ZIP code in Area 9, serving California, Oregon, Washington, Alaska, and Hawaii.`
        };
      default:
        return {
          isValid: true,
          postalCode: cleanCode,
          country: "United States",
          state: "District of Columbia",
          city: "Washington",
          district: "National Mall District",
          latitude: 38.9072,
          longitude: -77.0369,
          description: `A US ZIP code resolved in the nation's capital zone.`
        };
    }
  }

  if (normalizedCountry === "canada") {
    const firstLetter = cleanCode.charAt(0);
    switch (firstLetter) {
      case "A":
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "Newfoundland and Labrador", city: "St. John's", district: "Avalon Region", latitude: 47.5615, longitude: -52.7126, description: "A Canadian postal code resolved to Newfoundland." };
      case "B":
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "Nova Scotia", city: "Halifax", district: "Halifax Harbour Division", latitude: 44.6488, longitude: -63.5752, description: "A Canadian postal code resolved to Nova Scotia." };
      case "C":
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "Prince Edward Island", city: "Charlottetown", district: "Queens County", latitude: 46.2382, longitude: -63.1311, description: "A Canadian postal code resolved to Prince Edward Island." };
      case "E":
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "New Brunswick", city: "Fredericton", district: "York County", latitude: 45.9636, longitude: -66.6431, description: "A Canadian postal code resolved to New Brunswick." };
      case "G":
      case "H":
      case "J":
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "Quebec", city: "Montreal", district: "Ville-Marie District", latitude: 45.5017, longitude: -73.5673, description: "A Canadian postal code resolved to Quebec province." };
      case "K":
      case "L":
      case "M":
      case "N":
      case "P":
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "Ontario", city: "Toronto", district: "Greater Toronto Area", latitude: 43.6532, longitude: -79.3832, description: "A Canadian postal code resolved to Ontario province." };
      case "R":
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "Manitoba", city: "Winnipeg", district: "Red River District", latitude: 49.8951, longitude: -97.1384, description: "A Canadian postal code resolved to Manitoba." };
      case "S":
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "Saskatchewan", city: "Regina", district: "Wascana Region", latitude: 50.4452, longitude: -104.6189, description: "A Canadian postal code resolved to Saskatchewan." };
      case "T":
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "Alberta", city: "Calgary", district: "Bow Valley Region", latitude: 51.0447, longitude: -114.0719, description: "A Canadian postal code resolved to Alberta." };
      case "V":
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "British Columbia", city: "Vancouver", district: "Metro Vancouver", latitude: 49.2827, longitude: -123.1207, description: "A Canadian postal code resolved to British Columbia." };
      case "X":
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "Northwest Territories", city: "Yellowknife", district: "Great Slave Region", latitude: 62.4540, longitude: -114.3718, description: "A Canadian postal code resolved to Northwest Territories / Nunavut." };
      case "Y":
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "Yukon", city: "Whitehorse", district: "Yukon Valley", latitude: 60.7212, longitude: -135.0568, description: "A Canadian postal code resolved to Yukon territory." };
      default:
        return { isValid: true, postalCode: cleanCode, country: "Canada", state: "Ontario", city: "Ottawa", district: "Capital Hill District", latitude: 45.4215, longitude: -75.6972, description: "A general Canadian postal code." };
    }
  }

  if (normalizedCountry === "australia") {
    const firstDigit = cleanCode.charAt(0);
    switch (firstDigit) {
      case "0":
      case "8":
        return { isValid: true, postalCode: cleanCode, country: "Australia", state: "Northern Territory", city: "Darwin", district: "Darwin G.P.O.", latitude: -12.4634, longitude: 130.8456, description: "An Australian postcode resolved to Northern Territory." };
      case "2":
        return { isValid: true, postalCode: cleanCode, country: "Australia", state: "New South Wales", city: "Sydney", district: "Sydney District Center", latitude: -33.8688, longitude: 151.2093, description: "An Australian postcode resolved to New South Wales." };
      case "3":
        return { isValid: true, postalCode: cleanCode, country: "Australia", state: "Victoria", city: "Melbourne", district: "Melbourne City Loop", latitude: -37.8136, longitude: 144.9631, description: "An Australian postcode resolved to Victoria." };
      case "4":
        return { isValid: true, postalCode: cleanCode, country: "Australia", state: "Queensland", city: "Brisbane", district: "Brisbane North Region", latitude: -27.4698, longitude: 153.0251, description: "An Australian postcode resolved to Queensland." };
      case "5":
        return { isValid: true, postalCode: cleanCode, country: "Australia", state: "South Australia", city: "Adelaide", district: "Adelaide CBD", latitude: -34.9285, longitude: 138.6007, description: "An Australian postcode resolved to South Australia." };
      case "6":
        return { isValid: true, postalCode: cleanCode, country: "Australia", state: "Western Australia", city: "Perth", district: "Perth Coast Region", latitude: -31.9505, longitude: 115.8605, description: "An Australian postcode resolved to Western Australia." };
      case "7":
        return { isValid: true, postalCode: cleanCode, country: "Australia", state: "Tasmania", city: "Hobart", district: "Hobart City Center", latitude: -42.8821, longitude: 147.3272, description: "An Australian postcode resolved to Tasmania." };
      default:
        return { isValid: true, postalCode: cleanCode, country: "Australia", state: "Australian Capital Territory", city: "Canberra", district: "Capital Center", latitude: -35.2809, longitude: 149.1300, description: "An Australian postcode resolved to Australian Capital Territory." };
    }
  }

  if (normalizedCountry === "germany") {
    const firstDigit = cleanCode.charAt(0);
    switch (firstDigit) {
      case "0":
        return { isValid: true, postalCode: cleanCode, country: "Germany", state: "Saxony", city: "Dresden", district: "Dresden-Altstadt", latitude: 51.0504, longitude: 13.7373, description: "A German postleitzahl resolved to Saxony area." };
      case "1":
        return { isValid: true, postalCode: cleanCode, country: "Germany", state: "Berlin", city: "Berlin", district: "Mitte", latitude: 52.5200, longitude: 13.4050, description: "A German postleitzahl resolved to Berlin area." };
      case "2":
        return { isValid: true, postalCode: cleanCode, country: "Germany", state: "Hamburg", city: "Hamburg", district: "Altona", latitude: 53.5511, longitude: 9.9937, description: "A German postleitzahl resolved to Hamburg/Northern Germany." };
      case "3":
        return { isValid: true, postalCode: cleanCode, country: "Germany", state: "Lower Saxony", city: "Hannover", district: "Mitte", latitude: 52.3759, longitude: 9.7320, description: "A German postleitzahl resolved to central Lower Saxony." };
      case "4":
      case "5":
        return { isValid: true, postalCode: cleanCode, country: "Germany", state: "North Rhine-Westphalia", city: "Cologne", district: "Innenstadt", latitude: 50.9375, longitude: 6.9603, description: "A German postleitzahl resolved to North Rhine-Westphalia." };
      case "6":
        return { isValid: true, postalCode: cleanCode, country: "Germany", state: "Hesse", city: "Frankfurt", district: "Innenstadt", latitude: 50.1109, longitude: 8.6821, description: "A German postleitzahl resolved to Hesse / Rhine-Main area." };
      case "7":
        return { isValid: true, postalCode: cleanCode, country: "Germany", state: "Baden-Württemberg", city: "Stuttgart", district: "Mitte", latitude: 48.7758, longitude: 9.1829, description: "A German postleitzahl resolved to Baden-Württemberg." };
      case "8":
      case "9":
        return { isValid: true, postalCode: cleanCode, country: "Germany", state: "Bavaria", city: "Munich", district: "Altstadt-Lehel", latitude: 48.1351, longitude: 11.5820, description: "A German postleitzahl resolved to Bavaria area." };
      default:
        return { isValid: true, postalCode: cleanCode, country: "Germany", state: "Berlin", city: "Berlin", district: "Mitte", latitude: 52.5200, longitude: 13.4050, description: "A German postleitzahl." };
    }
  }

  if (normalizedCountry === "united kingdom") {
    const firstLetter = cleanCode.charAt(0);
    const firstTwo = cleanCode.substring(0, 2);

    if (firstTwo === "BT") {
      return { isValid: true, postalCode: cleanCode, country: "United Kingdom", state: "Northern Ireland", city: "Belfast", district: "Belfast City Center", latitude: 54.5973, longitude: -5.9301, description: "A UK postcode resolved to Northern Ireland." };
    } else if (firstTwo === "CF") {
      return { isValid: true, postalCode: cleanCode, country: "United Kingdom", state: "Wales", city: "Cardiff", district: "Cardiff Bay", latitude: 51.4816, longitude: -3.1791, description: "A UK postcode resolved to Wales." };
    } else if (firstTwo === "EH") {
      return { isValid: true, postalCode: cleanCode, country: "United Kingdom", state: "Scotland", city: "Edinburgh", district: "City Center", latitude: 55.9533, longitude: -3.1883, description: "A UK postcode resolved to Scotland." };
    } else if (firstTwo === "EC" || firstTwo === "WC" || firstTwo === "SW" || firstTwo === "SE" || firstTwo === "NW") {
      return { isValid: true, postalCode: cleanCode, country: "United Kingdom", state: "England", city: "London", district: "Greater London Area", latitude: 51.5074, longitude: -0.1278, description: "A UK postcode resolved to London region." };
    } else {
      switch (firstLetter) {
        case "B":
          return { isValid: true, postalCode: cleanCode, country: "United Kingdom", state: "England", city: "Birmingham", district: "Midlands District", latitude: 52.4862, longitude: -1.8904, description: "A UK postcode resolved to Birmingham." };
        case "E":
        case "N":
        case "W":
          return { isValid: true, postalCode: cleanCode, country: "United Kingdom", state: "England", city: "London", district: "London Area", latitude: 51.5074, longitude: -0.1278, description: "A UK postcode resolved to London." };
        case "G":
          return { isValid: true, postalCode: cleanCode, country: "United Kingdom", state: "Scotland", city: "Glasgow", district: "Lanarkshire", latitude: 55.8642, longitude: -4.2518, description: "A UK postcode resolved to Glasgow." };
        case "M":
          return { isValid: true, postalCode: cleanCode, country: "United Kingdom", state: "England", city: "Manchester", district: "Greater Manchester", latitude: 53.4808, longitude: -2.2426, description: "A UK postcode resolved to Manchester." };
        default:
          return { isValid: true, postalCode: cleanCode, country: "United Kingdom", state: "England", city: "London", district: "London District", latitude: 51.5074, longitude: -0.1278, description: "A general United Kingdom postcode." };
      }
    }
  }

  // Failsafe geocoding to capital or center coordinates
  const fallbackCoords = getFallbackCoordinates(normalizedCountry);
  const countryProfile = geoDatabase.countries[normalizedCountry];
  return {
    isValid: true,
    postalCode: cleanCode,
    country: countryProfile ? countryProfile.countryName : (countryName.charAt(0).toUpperCase() + countryName.slice(1)),
    state: countryProfile?.states?.[0]?.name || "Central Administrative Region",
    city: countryProfile?.capital || "Main Metropolitan",
    district: "General Post District",
    latitude: fallbackCoords.lat,
    longitude: fallbackCoords.lon,
    description: `A postal route code resolved within the region of ${countryProfile?.capital || countryName}.`
  };
}

/**
 * API Endpoint: Inspect country-wide details, states and PIN code patterns
 */
app.post("/api/countries/inspect", async (req, res) => {
  const { countryName, countryCode } = req.body;
  if (!countryName) {
    return res.status(400).json({ error: "countryName is required in request body" });
  }

  try {
    const normalized = countryName.trim().toLowerCase();
    const match = geoDatabase.countries[normalized];

    if (match) {
      return res.json(match);
    }

    // Dynamic fallback generation for unrecognized countries
    const fallbackResponse = {
      countryName: countryName,
      capital: `${countryName} City`,
      population: "Undetermined",
      currency: "Local Currency",
      language: "Official Language",
      phoneCode: "+000",
      flagEmoji: "🏳️",
      postalCodeLabel: "Postal Code",
      postalCodeFormat: "Alphanumeric or numeric",
      postalCodeRegexExplanation: "Standard local postal/ZIP format.",
      states: [
        {
          name: `${countryName} Northern Region`,
          code: "N-REG",
          capitalOrHq: `${countryName} North City`,
          typicalPincodes: ["1000", "1100"],
          description: `The northern administrative region of ${countryName}, representing key trade routes and local heritage.`
        },
        {
          name: `${countryName} Southern Region`,
          code: "S-REG",
          capitalOrHq: `${countryName} South City`,
          typicalPincodes: ["2000", "2100"],
          description: `The southern geographical region of ${countryName}, home to scenic coastal routes and agricultural hubs.`
        }
      ],
      generalPostalTrivia: `The postal routing system in ${countryName} is organized under regional sorting centers to support automated deliveries.`
    };

    return res.json(fallbackResponse);
  } catch (error: any) {
    console.error("Error inspecting country:", error);
    return res.status(500).json({ error: error.message || "Failed to inspect country." });
  }
});

/**
 * API Endpoint: Search location details for a specific PIN/postal code
 */
app.post("/api/postal/search", async (req, res) => {
  const { countryName, code } = req.body;
  if (!code || !countryName) {
    return res.status(400).json({ error: "Both countryName and code are required." });
  }

  try {
    const data = resolvePostalCodeOffline(countryName, code);
    return res.json(data);
  } catch (error: any) {
    console.error("Error searching postal code:", error);
    return res.status(500).json({ error: error.message || "Failed to lookup postal code." });
  }
});

// Setup Vite Dev Server / Static Serve
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite Development Server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running and listening on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
