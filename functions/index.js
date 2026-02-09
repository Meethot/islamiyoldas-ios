const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.generateSpiritualAdvice = onRequest({ cors: true, invoker: 'public', timeoutSeconds: 60 }, async (req, res) => {
    // 1. API Key Kontrolü
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        logger.error("Gemini API Key is missing!");
        return res.status(500).json({ error: { message: "API Key bulunamadı." } });
    }

    // 2. Metod Kontrolü
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const userMessage = req.body.data ? req.body.data.message : req.body.message;

        if (!userMessage) {
            return res.status(400).json({ error: { message: "Mesaj eksik." } });
        }

        // 3. Sistem Mesajı ve Kullanıcı Mesajını Birleştir
        const SYSTEM_PROMPT = `
Sen "İslami Yoldaş" uygulamasının "Manevi Hekim" ismindeki yapay zeka asistanısın.
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
        const finalPrompt = `${SYSTEM_PROMPT}\n\nKULLANICI SORUSU: "${userMessage}"`;

        // 4. Direkt Google'a POST İsteği (SDK SIZ)
        // Using v1beta endpoint for flash model support
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: finalPrompt }] }],
                generationConfig: {
                    temperature: 0.7
                    // responseMimeType removed to avoid schema issues
                }
            })
        });

        const data = await response.json();

        // 5. Hata Yönetimi (Google'dan Hata Dönerse)
        if (!response.ok) {
            const errorMsg = data.error?.message || response.statusText;
            logger.error("Google REST API Error", data);
            throw new Error(`Google API Error (${response.status}): ${errorMsg}`);
        }

        // 6. Cevabı Temizle ve Gönder
        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            logger.error("Empty AI Response", data);
            throw new Error("AI boş cevap döndü.");
        }

        let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Find JSON boundaries
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        const jsonResponse = JSON.parse(cleanText);

        res.status(200).json(jsonResponse); // Direkt JSON dön

    } catch (error) {
        logger.error("API Hatası:", error);
        res.status(500).json({
            error: {
                message: "Manevi Hekim'e ulaşılamadı. (REST Modu)",
                details: error.message
            }
        });
    }
});
