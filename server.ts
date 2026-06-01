import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// ES module path resolution compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
// Using process.env.GEMINI_API_KEY from environment safely server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

/**
 * API Endpoint: Inspect country-wide details, states and PIN code patterns
 */
app.post("/api/countries/inspect", async (req, res) => {
  const { countryName, countryCode } = req.body;
  if (!countryName) {
    return res.status(400).json({ error: "countryName is required in request body" });
  }

  try {
    const prompt = `Provide the structural information, state listings, standard postal/PIN code formats, and sample PIN codes for the country of "${countryName}" (${countryCode || "Unknown Code"}). Ensure accurate values for real administrative units/states and real postal configurations.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert geographical cataloger and postal code format analyst. Return full, rich state lists and precise PIN/postal code formats for the requested country in strict JSON format matching the schema rules.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "countryName",
            "capital",
            "population",
            "currency",
            "language",
            "phoneCode",
            "flagEmoji",
            "postalCodeLabel",
            "postalCodeFormat",
            "states"
          ],
          properties: {
            countryName: { type: Type.STRING, description: "Official country name in English." },
            capital: { type: Type.STRING, description: "Capital city of the country." },
            population: { type: Type.STRING, description: "Estimated population (e.g., '1.4 Billion' or '330 Million')." },
            currency: { type: Type.STRING, description: "Official currency name and symbol (e.g., 'Indian Rupee (INR)')." },
            language: { type: Type.STRING, description: "Primary or official language(s)." },
            phoneCode: { type: Type.STRING, description: "International calling dial code (e.g., '+91' or '+1')." },
            flagEmoji: { type: Type.STRING, description: "The flag emoji of this country." },
            postalCodeLabel: { type: Type.STRING, description: "How postal codes are referred to locally (e.g. 'PIN Code', 'ZIP Code', 'Postal Code', 'Postcode')." },
            postalCodeFormat: { type: Type.STRING, description: "Example format explanation (e.g., '6-digit numeric (e.g. 560001)' or 'Alphanumeric ANA NAN (e.g. K1A 0B1)')." },
            postalCodeRegexExplanation: { type: Type.STRING, description: "Description or regex guide of how the postal code works." },
            states: {
              type: Type.ARRAY,
              description: "Full listing of primary administrative sub-divisions (states, provinces, union territories, or regions). Limit to top 25-30 if there are too many (like in large countries).",
              items: {
                type: Type.OBJECT,
                required: ["name", "code", "capitalOrHq", "typicalPincodes", "description"],
                properties: {
                  name: { type: Type.STRING, description: "Name of the state, province, or region." },
                  code: { type: Type.STRING, description: "ISO code, postal code prefix, or standard short abbreviation (e.g., 'MH' for Maharashtra, 'CA' for California)." },
                  capitalOrHq: { type: Type.STRING, description: "Capital city or main administrative headquarters of this state/province." },
                  typicalPincodes: {
                    type: Type.ARRAY,
                    description: "3-4 real, typical sample postal/PIN codes that reside within this specific state.",
                    items: { type: Type.STRING }
                  },
                  description: { type: Type.STRING, description: "A concise 1-2 sentence description highlighting geographical details, famous landmarks, or a unique fact about this state." }
                }
              }
            },
            generalPostalTrivia: { type: Type.STRING, description: "Interesting fact about how the postal system is route-managed or historically evolved in this country." }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response returned from the AI model.");
    }

    const data = JSON.parse(text);
    return res.json(data);
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
    const prompt = `Lookup the location details, valid state/province, city/municipality, and detailed context of the postal code "${code}" inside the country "${countryName}".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional postal logistics lookup officer. Resolve the requested postal/PIN code to its correct location details in strict JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["isValid", "postalCode", "country", "state", "city", "district", "latitude", "longitude", "description"],
          properties: {
            isValid: { type: Type.BOOLEAN, description: "True if this is a real or plausible structural postal code for that country." },
            postalCode: { type: Type.STRING, description: "The normalized postal code input." },
            country: { type: Type.STRING, description: "Country name where it belongs." },
            state: { type: Type.STRING, description: "State, province, or primary administrative division of this postal code." },
            city: { type: Type.STRING, description: "City or town belonging to this postal code." },
            district: { type: Type.STRING, description: "District, neighborhood, post office, or block division details." },
            latitude: { type: Type.NUMBER, description: "Approximate latitude coordinate of this geographical center." },
            longitude: { type: Type.NUMBER, description: "Approximate longitude coordinate of this geographical center." },
            description: { type: Type.STRING, description: "A detailed 2-3 sentence overview describing the location, its key landmarks, local economic hub info, or shipping details." }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response returned from the model.");
    }

    const data = JSON.parse(text);
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
