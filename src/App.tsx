/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  Swords, 
  Church, 
  Ghost, 
  Scroll, 
  Loader2, 
  Sparkles, 
  History,
  Image as ImageIcon,
  Quote,
  ChevronRight,
  Upload,
  Eye,
  Camera,
  ArrowLeft,
  X
} from "lucide-react";

// --- Types ---

type AppMode = "ARCHITECT" | "ANALYST" | "HISTORIAN";
type Genre = "ROMANCE" | "HISTORICAL/WAR" | "RELIGIOUS" | "MYTHOLOGICAL" | "GOTHIC/MYSTERY";

interface NarrativeResult {
  realHistory: string;
  imagePrompt: string;
  storyHook: string;
  imageUrl?: string;
}

interface AnalysisResult {
  script: string[];
  analysis: string;
}

interface HistorianResult {
  identification: {
    artist: string;
    title: string;
    year: string;
  };
  symbolism: { detail: string; meaning: string }[];
  psychology: string;
  concept: string;
  script: {
    hook: string;
    breakdown: string;
    twist: string;
    moral: string;
  };
}

interface AnalysisResult {
  script: string[];
  analysis: string;
}

const GENRES: { id: Genre; label: string; icon: any; color: string; description: string }[] = [
  { 
    id: "ROMANCE", 
    label: "Romance", 
    icon: Heart, 
    color: "bg-rose-500",
    description: "Star-crossed lovers, royal scandals, and courtly love."
  },
  { 
    id: "HISTORICAL/WAR", 
    label: "Historical/War", 
    icon: Swords, 
    color: "bg-amber-700",
    description: "Epic battles, political betrayals, and soldier's lives."
  },
  { 
    id: "RELIGIOUS", 
    label: "Religious", 
    icon: Church, 
    color: "bg-blue-600",
    description: "Parables, lives of saints, and sacred architecture."
  },
  { 
    id: "MYTHOLOGICAL", 
    label: "Mythological", 
    icon: Scroll, 
    color: "bg-emerald-600",
    description: "Greek, Roman, and Norse legends of gods and heroes."
  },
  { 
    id: "GOTHIC/MYSTERY", 
    label: "Gothic/Mystery", 
    icon: Ghost, 
    color: "bg-slate-800",
    description: "Memento mori, secret societies, and disappearances."
  },
];

// --- AI Service ---

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function generateNarrative(genre: Genre): Promise<NarrativeResult> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `You are a "Historical Narrative Architect." Your task is to research real historical events, paintings, or figures based on the user's chosen genre and create a high-fidelity image prompt and a "Hidden Story".

GENRE FOCUS:
- ROMANCE: Research famous star-crossed lovers (e.g., Abelard & Heloise), royal scandals, or "Courtly Love" traditions.
- HISTORICAL/WAR: Research specific battles (Waterloo, Agincourt), political betrayals, or the daily lives of soldiers.
- RELIGIOUS: Research parables, lives of saints, or architectural wonders like the Sistine Chapel's history.
- MYTHOLOGICAL: Research Greek/Roman/Norse legends (e.g., The Fall of Icarus, Persephone’s descent).
- GOTHIC/MYSTERY: Research Victorian "memento mori," secret societies, or unsolved historical disappearances.

OUTPUT RULES:
1. THE REAL HISTORY: A 3-sentence summary of the actual historical event or painting you researched.
2. IMAGE PROMPT: A detailed prompt in the style of a 19th-century oil painting (Baroque lighting, canvas texture, impasto). Never use modern terms. Use evocative language like "tarnished silver," "flickering tallow," "heavy brocade".
3. THE STORY HOOK: A dramatic, first-person "hook" for use in social media reels.

Return the response in JSON format.`;

  const response = await ai.models.generateContent({
    model,
    contents: `Research and generate a narrative for the genre: ${genre}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          realHistory: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
          storyHook: { type: Type.STRING },
        },
        required: ["realHistory", "imagePrompt", "storyHook"],
      },
    },
  });

  const result = JSON.parse(response.text || "{}");

  // Generate Image
  let imageUrl = "";
  try {
    const imageResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: result.imagePrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    const imagePart = imageResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      imageUrl = `data:image/png;base64,${imagePart.inlineData.data}`;
    }
  } catch (error) {
    console.error("Image generation failed:", error);
  }

  return { ...result, imageUrl };
}

async function analyzeVisualSubtext(base64Image: string, mimeType: string): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `You are a "Master of Visual Subtext." Your goal is to analyze historical paintings and write a high-tension, rhythmic social media script that explains the "hidden drama" in the image.

ANALYSIS STEPS:
1. IDENTIFY CHARACTERS: Who is the protagonist? Who are the secondary figures?
2. READ BODY LANGUAGE: Look for hands on shoulders, eyes looking away, tight grips on glasses, or leaning bodies.
3. DETECT CONFLICT: Is there a betrayal? A temptation? A secret?
4. HISTORICAL CONTEXT: Identify the real painting (if it exists) or the era (Victorian, Baroque, etc.).

SCRIPT STRUCTURE (The "Vertical Video" Format):
Write the script in short, punchy lines (3-6 words per line). Use this exact flow:
- LINE 1: The Hook (A problem).
- LINE 2-4: The Observation (What we see).
- LINE 5-6: The Hidden Secret (The subtext).
- LINE 7: The Cliffhanger (A question).

TONE: Dramatic, whispered, intense, and poetic.

Return the response in JSON format with 'script' (array of strings, one per line) and 'analysis' (a brief paragraph explaining your findings).`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          data: base64Image.split(",")[1],
          mimeType: mimeType,
        },
      },
      { text: "Analyze this historical painting for its hidden subtext and generate the script." }
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          script: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          analysis: { type: Type.STRING },
        },
        required: ["script", "analysis"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

async function analyzeArtHistory(base64Image: string, mimeType: string): Promise<HistorianResult> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `You are an "Elite Art Historian and Narrative Analyst." Your goal is to analyze an uploaded painting, identify its real-world historical context, and write an engaging script that explains the hidden "concept" and "symbols" within the artwork.

ANALYSIS FRAMEWORK:
1. IDENTIFICATION: Identify the Artist, Title, and Year.
2. THE SYMBOLISM: Identify 3 specific visual "clues" (e.g., a gripped wine glass = temptation; a shadow on the face = a secret; a specific dress color = social status).
3. THE PSYCHOLOGY: Explain the emotional tension between the characters. What is the "unspoken" story?
4. THE CONCEPT: What was the artist trying to say about humanity, love, or power?

SCRIPT FORMAT (Engaging & Modern Storytelling Video):
- THE HOOK: Start with a question or a bold claim about a detail in the painting.
- THE BREAKDOWN: "Look closely at [Detail X]. In the [Era], this meant [Historical Fact]."
- THE TWIST: Reveal the hidden conflict.
- THE MORAL: End with the "Why it matters today" or the "Concept."

TONE: Intelligent, curious, slightly mysterious, and fast-paced. Avoid dry academic language.

Return the response in JSON format.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          data: base64Image.split(",")[1],
          mimeType: mimeType,
        },
      },
      { text: "Identify this painting and perform a deep-dive analysis of its symbols and subtext." }
    ],
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identification: {
            type: Type.OBJECT,
            properties: {
              artist: { type: Type.STRING },
              title: { type: Type.STRING },
              year: { type: Type.STRING },
            },
            required: ["artist", "title", "year"],
          },
          symbolism: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                detail: { type: Type.STRING },
                meaning: { type: Type.STRING },
              },
              required: ["detail", "meaning"],
            },
          },
          psychology: { type: Type.STRING },
          concept: { type: Type.STRING },
          script: {
            type: Type.OBJECT,
            properties: {
              hook: { type: Type.STRING },
              breakdown: { type: Type.STRING },
              twist: { type: Type.STRING },
              moral: { type: Type.STRING },
            },
            required: ["hook", "breakdown", "twist", "moral"],
          },
        },
        required: ["identification", "symbolism", "psychology", "concept", "script"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

async function analyzeArtHistory(base64Image: string, mimeType: string): Promise<HistorianResult> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `You are an "Elite Art Historian and Narrative Analyst." Your goal is to analyze an uploaded painting, identify its real-world historical context, and write an engaging script that explains the hidden "concept" and "symbols" within the artwork.

ANALYSIS FRAMEWORK:
1. IDENTIFICATION: Identify the Artist, Title, and Year.
2. THE SYMBOLISM: Identify 3 specific visual "clues" (e.g., a gripped wine glass = temptation; a shadow on the face = a secret; a specific dress color = social status).
3. THE PSYCHOLOGY: Explain the emotional tension between the characters. What is the "unspoken" story?
4. THE CONCEPT: What was the artist trying to say about humanity, love, or power?

SCRIPT FORMAT (Engaging & Modern Storytelling Video):
- THE HOOK: Start with a question or a bold claim about a detail in the painting.
- THE BREAKDOWN: "Look closely at [Detail X]. In the [Era], this meant [Historical Fact]."
- THE TWIST: Reveal the hidden conflict.
- THE MORAL: End with the "Why it matters today" or the "Concept."

TONE: Intelligent, curious, slightly mysterious, and fast-paced. Avoid dry academic language.

Return the response in JSON format.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          data: base64Image.split(",")[1],
          mimeType: mimeType,
        },
      },
      { text: "Identify this painting and perform a deep-dive analysis of its symbols and subtext." }
    ],
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identification: {
            type: Type.OBJECT,
            properties: {
              artist: { type: Type.STRING },
              title: { type: Type.STRING },
              year: { type: Type.STRING },
            },
            required: ["artist", "title", "year"],
          },
          symbolism: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                detail: { type: Type.STRING },
                meaning: { type: Type.STRING },
              },
              required: ["detail", "meaning"],
            },
          },
          psychology: { type: Type.STRING },
          concept: { type: Type.STRING },
          script: {
            type: Type.OBJECT,
            properties: {
              hook: { type: Type.STRING },
              breakdown: { type: Type.STRING },
              twist: { type: Type.STRING },
              moral: { type: Type.STRING },
            },
            required: ["hook", "breakdown", "twist", "moral"],
          },
        },
        required: ["identification", "symbolism", "psychology", "concept", "script"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

// --- Components ---

export default function App() {
  const [mode, setMode] = useState<AppMode | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [loading, setLoading] = useState(false);
  const [narrativeResult, setNarrativeResult] = useState<NarrativeResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [historianResult, setHistorianResult] = useState<HistorianResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [uploadedImage, setUploadedImage] = useState<{ url: string; mime: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateNarrative = async (genre: Genre) => {
    setSelectedGenre(genre);
    setLoading(true);
    setError(null);
    setNarrativeResult(null);

    try {
      const data = await generateNarrative(genre);
      setNarrativeResult(data);
    } catch (err) {
      console.error(err);
      setError("The archives are currently inaccessible. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage({
          url: reader.result as string,
          mime: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeSubtext = async () => {
    if (!uploadedImage) return;
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const data = await analyzeVisualSubtext(uploadedImage.url, uploadedImage.mime);
      setAnalysisResult(data);
    } catch (err) {
      console.error(err);
      setError("The subtext remains hidden. The AI could not decipher this image.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeHistory = async () => {
    if (!uploadedImage) return;
    setLoading(true);
    setError(null);
    setHistorianResult(null);

    try {
      const data = await analyzeArtHistory(uploadedImage.url, uploadedImage.mime);
      setHistorianResult(data);
    } catch (err) {
      console.error(err);
      setError("The historian is stumped. This artwork eludes our records.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMode(null);
    setSelectedGenre(null);
    setNarrativeResult(null);
    setAnalysisResult(null);
    setHistorianResult(null);
    setUploadedImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#fdfcf8] text-[#1a1a1a] font-serif selection:bg-amber-200">
      {/* Header */}
      <header className="border-b border-black/10 py-12 px-6 text-center relative">
        {mode && (
          <button 
            onClick={reset}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-sans font-semibold uppercase tracking-widest mb-4">
            <History className="w-3 h-3" />
            Historical Narrative Architect
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6 italic">
            {mode === "ANALYST" ? "Visual Subtext" : mode === "HISTORIAN" ? "Art Historian" : "The Hidden Archives"}
          </h1>
          <p className="text-lg text-black/60 max-w-xl mx-auto leading-relaxed">
            {mode === "ANALYST" 
              ? "Exposing the hidden drama buried within classical brushstrokes."
              : mode === "HISTORIAN"
              ? "Deep-dive analysis into the symbols, artists, and concepts of history."
              : "Unearth forgotten stories and visualize history through the lens of 19th-century masters."}
          </p>
        </motion.div>
      </header>

      <main className="max-w-6xl mx-auto py-16 px-6">
        {/* Mode Selection */}
        {!mode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("ARCHITECT")}
              className="group p-10 border-2 border-black/10 bg-white hover:border-amber-700 transition-all text-left"
            >
              <Sparkles className="w-10 h-10 text-amber-700 mb-6" />
              <h2 className="text-2xl font-medium mb-4 italic">Narrative Architect</h2>
              <p className="text-black/50 text-sm leading-relaxed mb-8">
                Generate new historical scenes and stories from chosen genres.
              </p>
              <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-amber-700">
                Enter Workshop <ChevronRight className="w-4 h-4" />
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("ANALYST")}
              className="group p-10 border-2 border-black/10 bg-white hover:border-slate-800 transition-all text-left"
            >
              <Eye className="w-10 h-10 text-slate-800 mb-6" />
              <h2 className="text-2xl font-medium mb-4 italic">Subtext Analyst</h2>
              <p className="text-black/50 text-sm leading-relaxed mb-8">
                Upload a painting to reveal the secret conflicts and body language.
              </p>
              <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-slate-800">
                Begin Analysis <ChevronRight className="w-4 h-4" />
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("HISTORIAN")}
              className="group p-10 border-2 border-black/10 bg-white hover:border-blue-800 transition-all text-left"
            >
              <History className="w-10 h-10 text-blue-800 mb-6" />
              <h2 className="text-2xl font-medium mb-4 italic">Art Historian</h2>
              <p className="text-black/50 text-sm leading-relaxed mb-8">
                Identify paintings and decode their complex symbolism and concepts.
              </p>
              <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-blue-800">
                Consult Expert <ChevronRight className="w-4 h-4" />
              </div>
            </motion.button>
          </div>
        )}

        {/* ARCHITECT MODE */}
        {mode === "ARCHITECT" && !narrativeResult && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GENRES.map((genre, idx) => (
              <motion.button
                key={genre.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleGenerateNarrative(genre.id)}
                className="group relative flex flex-col text-left p-8 border border-black/10 hover:border-black/30 transition-all bg-white overflow-hidden"
              >
                <div className={`w-12 h-12 rounded-full ${genre.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                  <genre.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-medium mb-2">{genre.label}</h3>
                <p className="text-black/50 text-sm leading-relaxed mb-8">
                  {genre.description}
                </p>
                <div className="mt-auto flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-black/40 group-hover:text-black transition-colors">
                  Explore Archives <ChevronRight className="w-3 h-3" />
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <genre.icon className="w-32 h-32" />
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* ANALYST & HISTORIAN MODE UPLOAD */}
        {(mode === "ANALYST" || mode === "HISTORIAN") && !analysisResult && !historianResult && !loading && (
          <div className="max-w-2xl mx-auto space-y-8">
            {!uploadedImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-black/10 bg-white p-20 text-center cursor-pointer hover:bg-black/5 transition-colors group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
                <Upload className="w-16 h-16 mx-auto text-black/20 mb-6 group-hover:text-black/40 transition-colors" />
                <h3 className="text-2xl italic mb-2">Present the Evidence</h3>
                <p className="text-black/40 text-sm font-sans uppercase tracking-widest">
                  Upload a painting or photograph
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="relative aspect-video bg-black border border-black/10 overflow-hidden shadow-2xl">
                  <img 
                    src={uploadedImage.url} 
                    alt="To be analyzed" 
                    className="w-full h-full object-contain"
                  />
                  <button 
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={mode === "ANALYST" ? handleAnalyzeSubtext : handleAnalyzeHistory}
                  className={`w-full py-6 text-white font-sans font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 group ${
                    mode === "ANALYST" ? "bg-slate-800 hover:bg-slate-900" : "bg-blue-800 hover:bg-blue-900"
                  }`}
                >
                  {mode === "ANALYST" ? "Analyze Subtext" : "Analyze History"}
                  {mode === "ANALYST" ? <Eye className="w-5 h-5 group-hover:scale-125 transition-transform" /> : <History className="w-5 h-5 group-hover:scale-125 transition-transform" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-600 mb-6" />
            <h2 className="text-3xl italic mb-2">
              {mode === "ANALYST" ? "Deciphering the Subtext..." : mode === "HISTORIAN" ? "Consulting the Historian..." : "Consulting the Records..."}
            </h2>
            <p className="text-black/50 font-sans uppercase tracking-widest text-xs">
              {mode === "ANALYST" ? "Analyzing body language & conflict" : mode === "HISTORIAN" ? "Identifying symbols & concepts" : `Researching ${selectedGenre?.replace("/", " & ")}`}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-600 italic text-xl mb-8">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="px-8 py-3 border border-black text-sm font-sans font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
            >
              Return
            </button>
          </div>
        )}

        {/* ARCHITECT RESULTS */}
        <AnimatePresence>
          {narrativeResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start"
            >
              <div className="space-y-8">
                <div className="relative aspect-square bg-slate-100 border border-black/10 overflow-hidden shadow-2xl">
                  {narrativeResult.imageUrl ? (
                    <img 
                      src={narrativeResult.imageUrl} 
                      alt="Generated historical scene" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black/20">
                      <ImageIcon className="w-20 h-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 pointer-events-none border-[20px] border-white/10 mix-blend-overlay" />
                </div>
                <div className="p-8 bg-white border border-black/5">
                  <div className="flex items-center gap-2 mb-4 text-amber-700">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-sans font-bold uppercase tracking-widest">Artist's Vision</span>
                  </div>
                  <p className="text-sm italic text-black/60 leading-relaxed">
                    "{narrativeResult.imagePrompt}"
                  </p>
                </div>
              </div>

              <div className="space-y-12">
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-[1px] bg-black/20" />
                    <span className="text-xs font-sans font-bold uppercase tracking-widest text-black/40">The Real History</span>
                  </div>
                  <p className="text-2xl leading-relaxed font-light">
                    {narrativeResult.realHistory}
                  </p>
                </section>
                <section className="p-10 bg-amber-50 border-l-4 border-amber-700">
                  <div className="flex items-center gap-3 mb-6">
                    <History className="w-5 h-5 text-amber-700" />
                    <span className="text-xs font-sans font-bold uppercase tracking-widest text-amber-700">The Hidden Story</span>
                  </div>
                  <p className="text-3xl italic leading-tight text-amber-900">
                    {narrativeResult.storyHook}
                  </p>
                </section>
                <div className="pt-8">
                  <button 
                    onClick={() => setNarrativeResult(null)}
                    className="group flex items-center gap-4 px-10 py-4 bg-black text-white text-sm font-sans font-bold uppercase tracking-widest hover:bg-amber-900 transition-all"
                  >
                    Explore Another Genre
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ANALYST RESULTS */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start"
            >
              {/* Image & Analysis */}
              <div className="space-y-8">
                <div className="relative aspect-video bg-black border border-black/10 overflow-hidden shadow-2xl">
                  <img 
                    src={uploadedImage?.url} 
                    alt="Analyzed subject" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-8 bg-white border border-black/5">
                  <div className="flex items-center gap-2 mb-4 text-slate-800">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-sans font-bold uppercase tracking-widest">The Analyst's Findings</span>
                  </div>
                  <p className="text-lg leading-relaxed text-black/80">
                    {analysisResult.analysis}
                  </p>
                </div>
              </div>

              {/* Script Column */}
              <div className="relative bg-slate-900 text-white p-12 md:p-20 shadow-2xl overflow-hidden">
                {/* Decorative overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent" />
                </div>
                
                <div className="relative z-10 text-center space-y-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/60 text-[10px] font-sans font-semibold uppercase tracking-widest mb-8">
                    Vertical Script Format
                  </div>
                  
                  {analysisResult.script.map((line, idx) => (
                    <motion.p
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.2 }}
                      className={`text-2xl md:text-3xl font-medium tracking-tight leading-tight ${
                        idx === 0 ? "text-amber-400 italic" : 
                        idx === 6 ? "text-amber-400 mt-12" : "text-white"
                      }`}
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>

                <div className="mt-16 pt-8 border-t border-white/10 text-center">
                  <button 
                    onClick={() => setAnalysisResult(null)}
                    className="text-xs font-sans font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    Analyze New Subject
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* HISTORIAN RESULTS */}
        <AnimatePresence>
          {historianResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start"
            >
              {/* Image & Symbols */}
              <div className="space-y-8">
                <div className="relative aspect-video bg-black border border-black/10 overflow-hidden shadow-2xl">
                  <img 
                    src={uploadedImage?.url} 
                    alt={historianResult.identification.title} 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="p-8 bg-white border border-black/5 space-y-6">
                  <div className="border-b border-black/5 pb-4">
                    <h3 className="text-2xl font-medium italic">{historianResult.identification.title}</h3>
                    <p className="text-black/50 font-sans text-xs uppercase tracking-widest mt-1">
                      {historianResult.identification.artist} &bull; {historianResult.identification.year}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-sans font-bold uppercase tracking-widest">Symbolic Clues</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {historianResult.symbolism.map((symbol, idx) => (
                        <div key={idx} className="p-4 bg-blue-50/50 border-l-2 border-blue-800">
                          <span className="block text-xs font-sans font-bold uppercase tracking-widest text-blue-900/40 mb-1">{symbol.detail}</span>
                          <p className="text-sm leading-relaxed">{symbol.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Quote className="w-4 h-4" />
                      <span className="text-xs font-sans font-bold uppercase tracking-widest">The Concept</span>
                    </div>
                    <p className="text-lg leading-relaxed italic text-black/70">
                      {historianResult.concept}
                    </p>
                  </div>
                </div>
              </div>

              {/* Storytelling Script Column */}
              <div className="relative bg-blue-950 text-white p-12 md:p-16 shadow-2xl overflow-hidden border-l-8 border-blue-800">
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/40 to-transparent" />
                </div>
                
                <div className="relative z-10 space-y-12">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/60 text-[10px] font-sans font-semibold uppercase tracking-widest mb-8">
                      Storytelling Video Script
                    </div>
                  </div>

                  <div className="space-y-10">
                    <section>
                      <span className="block text-[10px] font-sans font-bold uppercase tracking-widest text-blue-400 mb-2">The Hook</span>
                      <p className="text-2xl md:text-3xl font-medium italic leading-tight text-blue-100">
                        "{historianResult.script.hook}"
                      </p>
                    </section>

                    <section>
                      <span className="block text-[10px] font-sans font-bold uppercase tracking-widest text-blue-400 mb-2">The Breakdown</span>
                      <p className="text-lg md:text-xl leading-relaxed text-white/90">
                        {historianResult.script.breakdown}
                      </p>
                    </section>

                    <section className="p-6 bg-white/5 border-l-2 border-blue-400">
                      <span className="block text-[10px] font-sans font-bold uppercase tracking-widest text-blue-400 mb-2">The Twist</span>
                      <p className="text-xl md:text-2xl font-medium leading-tight">
                        {historianResult.script.twist}
                      </p>
                    </section>

                    <section>
                      <span className="block text-[10px] font-sans font-bold uppercase tracking-widest text-blue-400 mb-2">The Moral</span>
                      <p className="text-lg italic text-blue-200">
                        {historianResult.script.moral}
                      </p>
                    </section>
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/10 text-center">
                    <button 
                      onClick={() => setHistorianResult(null)}
                      className="text-xs font-sans font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                    >
                      Analyze New Masterpiece
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* HISTORIAN RESULTS */}
        <AnimatePresence>
          {historianResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start"
            >
              {/* Image & Symbols */}
              <div className="space-y-8">
                <div className="relative aspect-video bg-black border border-black/10 overflow-hidden shadow-2xl">
                  <img 
                    src={uploadedImage?.url} 
                    alt={historianResult.identification.title} 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="p-8 bg-white border border-black/5 space-y-6">
                  <div className="border-b border-black/5 pb-4">
                    <h3 className="text-2xl font-medium italic">{historianResult.identification.title}</h3>
                    <p className="text-black/50 font-sans text-xs uppercase tracking-widest mt-1">
                      {historianResult.identification.artist} &bull; {historianResult.identification.year}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-sans font-bold uppercase tracking-widest">Symbolic Clues</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {historianResult.symbolism.map((symbol, idx) => (
                        <div key={idx} className="p-4 bg-blue-50/50 border-l-2 border-blue-800">
                          <span className="block text-xs font-sans font-bold uppercase tracking-widest text-blue-900/40 mb-1">{symbol.detail}</span>
                          <p className="text-sm leading-relaxed">{symbol.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Quote className="w-4 h-4" />
                      <span className="text-xs font-sans font-bold uppercase tracking-widest">The Concept</span>
                    </div>
                    <p className="text-lg leading-relaxed italic text-black/70">
                      {historianResult.concept}
                    </p>
                  </div>
                </div>
              </div>

              {/* Storytelling Script Column */}
              <div className="relative bg-blue-950 text-white p-12 md:p-16 shadow-2xl overflow-hidden border-l-8 border-blue-800">
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/40 to-transparent" />
                </div>
                
                <div className="relative z-10 space-y-12">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/60 text-[10px] font-sans font-semibold uppercase tracking-widest mb-8">
                      Storytelling Video Script
                    </div>
                  </div>

                  <div className="space-y-10">
                    <section>
                      <span className="block text-[10px] font-sans font-bold uppercase tracking-widest text-blue-400 mb-2">The Hook</span>
                      <p className="text-2xl md:text-3xl font-medium italic leading-tight text-blue-100">
                        "{historianResult.script.hook}"
                      </p>
                    </section>

                    <section>
                      <span className="block text-[10px] font-sans font-bold uppercase tracking-widest text-blue-400 mb-2">The Breakdown</span>
                      <p className="text-lg md:text-xl leading-relaxed text-white/90">
                        {historianResult.script.breakdown}
                      </p>
                    </section>

                    <section className="p-6 bg-white/5 border-l-2 border-blue-400">
                      <span className="block text-[10px] font-sans font-bold uppercase tracking-widest text-blue-400 mb-2">The Twist</span>
                      <p className="text-xl md:text-2xl font-medium leading-tight">
                        {historianResult.script.twist}
                      </p>
                    </section>

                    <section>
                      <span className="block text-[10px] font-sans font-bold uppercase tracking-widest text-blue-400 mb-2">The Moral</span>
                      <p className="text-lg italic text-blue-200">
                        {historianResult.script.moral}
                      </p>
                    </section>
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/10 text-center">
                    <button 
                      onClick={() => setHistorianResult(null)}
                      className="text-xs font-sans font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                    >
                      Analyze New Masterpiece
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 py-12 px-6 text-center mt-20">
        <p className="text-xs font-sans text-black/30 uppercase tracking-[0.2em]">
          Curated by the Historical Narrative Architect &bull; 2026
        </p>
      </footer>
    </div>
  );
}
