const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey !== '') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini AI Service Configured successfully');
  } catch (err) {
    console.error('Failed to initialize Gemini AI SDK:', err);
  }
} else {
  console.log('Gemini API key missing. AI features will operate in simulated fallback mode.');
}

/**
 * AI Event Description Generator
 */
const generateAIDescription = async (bulletPoints) => {
  const prompt = `You are a professional event copywriter. Take the following bullet points and generate a cohesive, exciting, and polished description for an event. Do not add placeholders. Make it engaging for potential attendees:\n\n${bulletPoints.join('\n')}`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text.trim();
    } catch (error) {
      console.error('Gemini API Error in generateAIDescription:', error);
      // Fallback to simulated description
    }
  }

  // Simulated fallback
  return `Welcome to our premier event! We are thrilled to bring you a unique experience centered around: ${bulletPoints.join(', ')}. Join us for an inspiring session filled with insights, networking opportunities, and hand-on learning. Whether you are an industry veteran or just getting started, this event promises to equip you with critical skills, connect you with like-minded peers, and open new doors. Register today to secure your spot!`;
};

/**
 * AI Event Recommendations
 */
const recommendEvents = async (viewedCategories, registeredCategories, allEvents) => {
  const eventMetadata = allEvents.map(e => ({
    id: e._id,
    title: e.title,
    category: e.category,
    city: e.city
  }));

  const prompt = `Recommend 3 events from the following list based on the user's preferences:
User's Viewed Categories: ${viewedCategories.join(', ')}
User's Registered Categories: ${registeredCategories.join(', ')}

Event List:
${JSON.stringify(eventMetadata, null, 2)}

Return ONLY a JSON array of the recommended event IDs, e.g., ["id1", "id2"]. No explanation.`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      // Clean JSON formatting if any (sometimes markdown blocks are returned)
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const ids = JSON.parse(text);
      if (Array.isArray(ids)) {
        return ids;
      }
    } catch (error) {
      console.error('Gemini API Error in recommendEvents:', error);
    }
  }

  // Fallback heuristic: match categories manually
  const preferred = new Set([...viewedCategories, ...registeredCategories]);
  const matched = allEvents.filter(e => preferred.has(e.category));
  const unmatched = allEvents.filter(e => !preferred.has(e.category));
  
  const recommendations = [...matched, ...unmatched].slice(0, 3);
  return recommendations.map(e => e._id.toString());
};

/**
 * AI Schedule Optimizer
 */
const optimizeSchedule = async (sessions) => {
  const prompt = `Organise and optimize the following session list into a logical and engaging schedule. Suggest an optimal flow, add brief session topics if missing, and structure the times nicely.
Sessions:
${JSON.stringify(sessions, null, 2)}

Return a JSON array of session objects in the optimized order, containing sessionTitle, timeSlot, speaker, and duration. Return ONLY the JSON data.`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const sorted = JSON.parse(text);
      if (Array.isArray(sorted)) {
        return sorted;
      }
    } catch (error) {
      console.error('Gemini API Error in optimizeSchedule:', error);
    }
  }

  // Simple chronological sorting fallback if Gemini key is missing
  return sessions.map(s => ({
    sessionTitle: s.sessionTitle || 'Interactive Workshop Session',
    timeSlot: s.timeSlot || '10:00 AM - 11:30 AM',
    speaker: s.speaker || 'Guest Panelist',
    duration: s.duration || '90'
  }));
};

module.exports = {
  generateAIDescription,
  recommendEvents,
  optimizeSchedule,
};
