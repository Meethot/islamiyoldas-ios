// Direct Google REST API URL Base (Using v1beta for new models)
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Fallback Model List (Prioritize User Choice)
const FALLBACK_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash"
];

/**
 * Calls the Google Gemini API directly from the client (EMERGENCY BYPASS).
 * @param {string} userMessage - The user's input/problem.
 * @returns {Promise<Object>} - The parsed JSON response (advice, zikr, verse).
 */
export async function getSpiritualAdvice(userMessage) {
    if (!userMessage || userMessage.trim().length === 0) {
        throw new Error("Lütfen bir şeyler yazın.");
    }

    // Get API Key from Environment Variables (Vite)
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBmDCS4puI_b_3xxKTPF1dmjtCYRs7Kl3I';

    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        throw new Error("API Key eksik! Lütfen .env dosyanıza VITE_GEMINI_API_KEY ekleyin.");
    }

    const SYSTEM_PROMPT = `
Sen "İslami Yoldaş" uygulamasının "Manevi Asistan" ismindeki yapay zeka asistanısın.
Görevin: Kullanıcının dertlerine Kuran, Sünnet ve Tasavvuf ışığında, şefkatli ve hikmetli bir dille cevap vermek.

KURALLAR:
1. ASLA fetva verme (Haram/Helal deme). Sadece tavsiye, teselli ve yol gösterme yap.
2. Sen bir Manevi Rehbersin. Sadece İslami, ahlaki ve manevi konularda rehberlik et. Siyaset, futbol, magazin, borsa tahmini veya uygunsuz konular açılırsa, nazikçe "Ben sadece manevi konularda yardımcı olabilirim" diyerek konuyu kapat.
3. Nefret söylemi, cinsellik veya şiddet içeren konularda cevap verme.
4. Cevapların kısa, öz ve kalbe dokunan türden olsun.
5. Mutlaka bir "Manevi Reçete" oluştur.

Output MUST be a valid JSON object only. Do not wrap in markdown blocks.

ÇIKTI FORMATI (JSON):
{
  "advice": "Kullanıcıya hitaben yazılmış, 2-3 cümlelik şefkatli metin.",
  "recommendedZikr": {
    "name": "Önerilen Esma veya Zikir",
    "meaning": "Zikrin kısa anlamı",
    "count": 33
  },
  "quranRef": {
    "surah": 94,
    "verse": 5,
    "reason": "Neden seçildiğine dair kısa not."
  }
}
`;

    // Helper for API Call with Retry Logic & Model Fallback
    const callApi = async (modelIndex = 0, retryCount = 0) => {
        const currentModel = FALLBACK_MODELS[modelIndex];

        // If we ran out of models
        if (!currentModel) {
            throw new Error("Hiçbir model çalıştırılamadı. Lütfen daha sonra tekrar deneyin.");
        }

        try {
            console.log(`Trying Model: ${currentModel} (Attempt ${retryCount + 1})`);

            const response = await fetch(`${GEMINI_API_BASE}/${currentModel}:generateContent?key=${API_KEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `SYSTEM: ${SYSTEM_PROMPT}\n\nUSER: ${userMessage}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7
                    }
                })
            });

            // 429: Rate Limit -> Retry same model
            if (response.status === 429 && retryCount < 2) {
                console.warn(`Rate limit hit (429) on ${currentModel}, retrying in 2s...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return callApi(modelIndex, retryCount + 1);
            }

            // 404: Model Not Found -> Try NEXT model
            if (response.status === 404) {
                console.warn(`Model ${currentModel} returned 404. Switching to next fallback...`);
                return callApi(modelIndex + 1, 0); // Try next model, reset retries
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || response.statusText;
                throw new Error(`Google API Hatası (${response.status}) [${currentModel}]: ${errorMessage}`);
            }

            return response;
        } catch (error) {
            // If network error, maybe try next model? No, could be transient.
            // Let's rethrow unless it's strictly a model issue handled above.
            throw error;
        }
    };

    try {
        const response = await callApi();
        const data = await response.json();

        // Extract text safely
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            throw new Error("Yapay zeka boş cevap döndü.");
        }

        // Clean Markdown JSON blocks
        let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Ensure pure JSON structure
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        try {
            return JSON.parse(cleanText);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, cleanText);
            throw new Error("Gelen cevap formatı bozuk, lütfen tekrar deneyin.");
        }

    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
}
