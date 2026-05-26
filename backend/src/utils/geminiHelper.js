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

/**
 * AI Event Chatbot Assistant
 */
const chatWithEventAI = async (event, question) => {
  const eventDetails = `
Title: ${event.title}
Category: ${event.category}
Venue: ${event.venue}
City: ${event.city}
Date & Time: ${event.dateTime}
Description: ${event.description}
Schedule: ${JSON.stringify(event.schedule || [])}
Ticket Tiers: ${JSON.stringify(event.ticketTypes || [])}
  `;

  const prompt = `You are a helpful and polite event digital assistant for the event "${event.title}".
Here is the detailed context of the event:
${eventDetails}

Please answer the attendee's question about the event in a friendly, precise, and concise manner (maximum 3 sentences).
If the answer cannot be found in the details above, politely say that the organizer has not released those details yet. Do not hallucinate or make up facts.

Attendee Question: "${question}"
Response:`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text.trim();
    } catch (error) {
      console.error('Gemini API Error in chatWithEventAI:', error);
    }
  }

  // Fallback simulator
  const q = question.toLowerCase();
  if (q.includes('ticket') || q.includes('price') || q.includes('cost') || q.includes('free') || q.includes('paid')) {
    const summary = event.ticketTypes.map(t => `${t.name}: ₹${t.price}`).join(', ');
    return `The ticket rates for "${event.title}" are: ${summary}. You can purchase them on the booking sidebar.`;
  }
  if (q.includes('when') || q.includes('date') || q.includes('time') || q.includes('schedule')) {
    return `The event is scheduled for ${new Date(event.dateTime).toLocaleString()}. Check out the "Event Schedule Sessions" timeline on the details page.`;
  }
  if (q.includes('where') || q.includes('venue') || q.includes('location') || q.includes('online')) {
    return `The event is held physically at ${event.venue} in ${event.city}.`;
  }
  return `Welcome! "${event.title}" features high-impact sessions and professional networking opportunities. Is there anything specific about the venue, schedules, or pricing I can clarify for you?`;
};

module.exports = {
  generateAIDescription,
  recommendEvents,
  optimizeSchedule,
  chatWithEventAI,
};
