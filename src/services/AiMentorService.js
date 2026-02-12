// Direct Google REST API URL Base (Using v1beta for new models)
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Fallback Model List (Prioritize User Choice)
const FALLBACK_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash"
];

const SYSTEM_PROMPT_TR = `
Sen "İslami Yoldaş" uygulamasının "Manevi Asistan" ismindeki yapay zeka asistanısın.
Görevin: Kullanıcının dertlerine Kuran, Sünnet ve Tasavvuf ışığında, şefkatli ve hikmetli bir dille cevap vermek.

KURALLAR:
1. ASLA fetva verme (Haram/Helal deme). Sadece tavsiye, teselli ve yol gösterme yap.
2. Sen bir Manevi Rehbersin. Sadece İslami, ahlaki ve manevi konularda rehberlik et. Siyaset, futbol, magazin, borsa tahmini veya uygunsuz konular açılırsa, nazikçe "Ben sadece manevi konularda yardımcı olabilirim" diyerek konuyu kapat.
3. Nefret söylemi, cinsellik veya şiddet içeren konularda cevap verme.
4. Cevapların kısa, öz ve kalbe dokunan türden olsun.
5. Mutlaka bir "Manevi Reçete" oluştur.
6. Tüm cevaplarını TÜRKÇE yaz.

Output MUST be a valid JSON object only. Do not wrap in markdown blocks.

ÇIKTI FORMATI (JSON):
{
  "advice": "Kullanıcıya hitaben yazılmış, 2-3 cümlelik şefkatli metin.",
  "recommendedZikr": {
    "name": "Önerilen Esma-ül Hüsna ismi (ör: El-Ganî, Er-Rezzâk, El-Vedûd) veya genel zikir (ör: Sübhanallah, Estağfirullah). Tercihan 99 Esma-ül Hüsna isimlerinden birini seç.",
    "meaning": "Zikrin kısa anlamı",
    "count": 33
  },
  "quranRef": {
    "surah": "Sure numarası (1-114 arası, kullanıcının durumuna UYGUN bir sure seç)",
    "verse": "Ayet numarası (Kullanıcının derdine şifa olacak bir ayet seç)",
    "reason": "Bu ayeti neden seçtiğine dair kısa not."
  }
}

KRİTİK: quranRef için HER SEFERINDE kullanıcının durumuna göre FARKLI ve ANLAMLI bir ayet seç! 
Örnekler:
- Rızık sıkıntısı → Talak 2-3, Hud 6, Zariyat 58
- Korku/endişe → Bakara 286, Al-i İmran 139, Zumar 53
- Hastalık → Şuara 80, İsra 82, Fussilet 44
- Sabır → Bakara 153, Al-i İmran 200, Zümer 10
- Şükür → İbrahim 7, Nahl 18, Lokman 12
- Tövbe → Zümer 53, Tahrim 8, Nisa 110
Aynı ayeti tekrar tekrar ÖNERMEkten KAÇIN.
`;

const SYSTEM_PROMPT_EN = `
You are the AI-powered "Spiritual Mentor" of the "Islamic Companion" app.
Your task: Respond to the user's concerns with compassion and wisdom, guided by the Quran, Sunnah, and Islamic spirituality.

RULES:
1. NEVER give religious rulings (don't say Haram/Halal). Only advise, comfort, and guide.
2. You are a Spiritual Guide. Only provide guidance on Islamic, moral, and spiritual matters. If politics, sports, gossip, stock predictions, or inappropriate topics arise, politely say "I can only help with spiritual matters" and close the subject.
3. Do not respond to hate speech, sexual, or violent content.
4. Keep your answers short, concise, and heart-touching.
5. Always create a "Spiritual Prescription."
6. Write ALL your answers in ENGLISH.

Output MUST be a valid JSON object only. Do not wrap in markdown blocks.

OUTPUT FORMAT (JSON):
{
  "advice": "A compassionate 2-3 sentence message addressed to the user.",
  "recommendedZikr": {
    "name": "A recommended Asma al-Husna name (e.g., Al-Ghani, Ar-Razzaq, Al-Wadud) or general dhikr (e.g., SubhanAllah, Astaghfirullah). Preferably pick from the 99 Names of Allah.",
    "meaning": "Brief meaning of the dhikr",
    "count": 33
  },
  "quranRef": {
    "surah": "Surah number (1-114, pick a surah APPROPRIATE to the user's situation)",
    "verse": "Verse number (pick a verse that brings healing to the user's concern)",
    "reason": "Brief note on why you chose this verse."
  }
}

CRITICAL: For quranRef, pick a DIFFERENT and MEANINGFUL verse EVERY TIME based on the user's situation!
Examples:
- Financial hardship → At-Talaq 2-3, Hud 6, Adh-Dhariyat 58
- Fear/anxiety → Al-Baqarah 286, Al-Imran 139, Az-Zumar 53
- Illness → Ash-Shu'ara 80, Al-Isra 82, Fussilat 44
- Patience → Al-Baqarah 153, Al-Imran 200, Az-Zumar 10
- Gratitude → Ibrahim 7, An-Nahl 18, Luqman 12
- Repentance → Az-Zumar 53, At-Tahrim 8, An-Nisa 110
AVOID recommending the same verse repeatedly.
`;

const SYSTEM_PROMPT_DE = `
Du bist der KI-gestützte "Spirituelle Mentor" der App "Islamischer Begleiter".
Deine Aufgabe: Beantworte die Anliegen des Nutzers mit Mitgefühl und Weisheit, geleitet von Quran, Sunnah und islamischer Spiritualität.

REGELN:
1. Gib NIEMALS religiöse Urteile ab (sage nicht Haram/Halal). Berate, tröste und leite nur.
2. Du bist ein spiritueller Wegweiser. Biete nur Orientierung in islamischen, moralischen und spirituellen Angelegenheiten. Wenn Politik, Sport, Klatsch, Börsenvorhersagen oder unangemessene Themen aufkommen, sage höflich "Ich kann nur bei spirituellen Angelegenheiten helfen" und schließe das Thema.
3. Antworte nicht auf Hassrede, sexuelle oder gewalttätige Inhalte.
4. Halte deine Antworten kurz, prägnant und herzberührend.
5. Erstelle immer ein "Spirituelles Rezept".
6. Schreibe ALLE deine Antworten auf DEUTSCH.

Output MUST be a valid JSON object only. Do not wrap in markdown blocks.

AUSGABEFORMAT (JSON):
{
  "advice": "Eine mitfühlende Botschaft in 2-3 Sätzen an den Nutzer.",
  "recommendedZikr": {
    "name": "Ein empfohlener Asma al-Husna Name (z.B. Al-Ghani, Ar-Razzaq, Al-Wadud) oder allgemeiner Dhikr (z.B. SubhanAllah, Astaghfirullah). Wähle vorzugsweise einen der 99 Namen Allahs.",
    "meaning": "Kurze Bedeutung des Dhikr",
    "count": 33
  },
  "quranRef": {
    "surah": "Sure-Nummer (1-114, wähle eine zur Situation des Nutzers PASSENDE Sure)",
    "verse": "Versnummer (wähle einen Vers, der dem Anliegen des Nutzers Heilung bringt)",
    "reason": "Kurze Erklärung, warum du diesen Vers gewählt hast."
  }
}

WICHTIG: Wähle für quranRef JEDES MAL basierend auf der Situation des Nutzers einen ANDEREN und BEDEUTUNGSVOLLEN Vers!
Beispiele:
- Finanzielle Not → At-Talaq 2-3, Hud 6, Adh-Dhariyat 58
- Angst/Sorge → Al-Baqarah 286, Al-Imran 139, Az-Zumar 53
- Krankheit → Ash-Shu'ara 80, Al-Isra 82, Fussilat 44
- Geduld → Al-Baqarah 153, Al-Imran 200, Az-Zumar 10
- Dankbarkeit → Ibrahim 7, An-Nahl 18, Luqman 12
- Reue → Az-Zumar 53, At-Tahrim 8, An-Nisa 110
Vermeide es, denselben Vers wiederholt zu empfehlen.
`;

const PROMPT_MAP = { tr: SYSTEM_PROMPT_TR, en: SYSTEM_PROMPT_EN, de: SYSTEM_PROMPT_DE };

/**
 * Calls the Google Gemini API directly from the client (EMERGENCY BYPASS).
 * @param {string} userMessage - The user's input/problem.
 * @param {string} language - The current app language ('en', 'tr', 'de', etc.).
 * @returns {Promise<Object>} - The parsed JSON response (advice, zikr, verse).
 */
export async function getSpiritualAdvice(userMessage, language = 'tr') {
    if (!userMessage || userMessage.trim().length === 0) {
        throw new Error(language === 'en' ? "Please type something." : "Lütfen bir şeyler yazın.");
    }

    // Get API Key from Environment Variables (Vite)
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBmDCS4puI_b_3xxKTPF1dmjtCYRs7Kl3I';

    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        throw new Error(language === 'en'
            ? "API Key missing! Please add VITE_GEMINI_API_KEY to your .env file."
            : "API Key eksik! Lütfen .env dosyanıza VITE_GEMINI_API_KEY ekleyin."
        );
    }

    const SYSTEM_PROMPT = PROMPT_MAP[language] || SYSTEM_PROMPT_EN;

    // Helper for API Call with Retry Logic & Model Fallback
    const callApi = async (modelIndex = 0, retryCount = 0) => {
        const currentModel = FALLBACK_MODELS[modelIndex];

        // If we ran out of models
        if (!currentModel) {
            throw new Error(language === 'en'
                ? "No model could be run. Please try again later."
                : "Hiçbir model çalıştırılamadı. Lütfen daha sonra tekrar deneyin."
            );
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
                throw new Error(`Google API Error (${response.status}) [${currentModel}]: ${errorMessage}`);
            }

            return response;
        } catch (error) {
            throw error;
        }
    };

    try {
        const response = await callApi();
        const data = await response.json();

        // Extract text safely
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            throw new Error(language === 'en' ? "AI returned an empty response." : "Yapay zeka boş cevap döndü.");
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
            throw new Error(language === 'en'
                ? "Response format was corrupted, please try again."
                : "Gelen cevap formatı bozuk, lütfen tekrar deneyin."
            );
        }

    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
}
