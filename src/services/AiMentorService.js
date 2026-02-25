/**
 * AI Mentor Service — calls Firebase Cloud Function (server-side proxy).
 * The Gemini API key NEVER leaves the server.
 */

const FUNCTION_URL_BASE = "https://us-central1-islami-yoldas-app.cloudfunctions.net/generateSpiritualAdvice";

/**
 * Calls the server-side Gemini proxy for spiritual advice.
 * @param {string} userMessage - The user's input/problem.
 * @param {string} language - The current app language ('en', 'tr', 'de', etc.).
 * @returns {Promise<Object>} - The parsed JSON response (advice, zikr, verse).
 */
export async function getSpiritualAdvice(userMessage, language = 'tr') {
  if (!userMessage || userMessage.trim().length === 0) {
    throw new Error(language === 'en' ? "Please type something." : "Lütfen bir şeyler yazın.");
  }

  if (userMessage.length > 2000) {
    throw new Error(language === 'en' ? "Message too long (max 2000 characters)." : "Mesaj çok uzun (max 2000 karakter).");
  }

  try {
    const response = await fetch(FUNCTION_URL_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          message: userMessage,
          language: language
        }
      })
    });

    if (response.status === 429) {
      throw new Error(
        language === 'en'
          ? "Too many requests. Please wait a moment."
          : "Çok fazla istek gönderildi. Lütfen biraz bekleyin."
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || (
        language === 'en'
          ? "Could not reach Spiritual Mentor. Please try again."
          : "Manevi Asistan'a ulaşılamadı. Lütfen tekrar deneyin."
      ));
    }

    return await response.json();
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
}
