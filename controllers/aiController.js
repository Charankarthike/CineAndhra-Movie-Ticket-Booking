const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../config/db');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Fetch live movie + show data from DB to inject as context
 */
async function getMovieContext() {
  try {
    const [movies] = await pool.query(
      `SELECT m.movie_id, m.title, m.duration, m.description,
              GROUP_CONCAT(
                CONCAT(t.name, ' @ ', DATE_FORMAT(s.show_time, '%d %b %H:%i'), ' — ₹', s.ticket_price)
                ORDER BY s.show_time SEPARATOR ' | '
              ) AS shows
       FROM Movies m
       LEFT JOIN Shows s ON s.movie_id = m.movie_id
       LEFT JOIN Theaters t ON t.theater_id = s.theater_id
       GROUP BY m.movie_id`
    );

    if (!movies.length) {
      return 'No movies are currently available in the database.';
    }

    return movies.map(m =>
      `🎬 ${m.title} (${Math.floor(m.duration / 60)}h ${m.duration % 60}m)\n` +
      `   ${m.description || 'No description.'}\n` +
      (m.shows ? `   Shows: ${m.shows}` : '   No shows scheduled yet.')
    ).join('\n\n');
  } catch (err) {
    console.error('AI context fetch error:', err);
    return 'Movie data temporarily unavailable.';
  }
}

/**
 * POST /api/ai/chat
 * Body: { message: string, history: [{role, parts}] }
 */
async function chatWithAI(req, res) {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'AI service is not configured. Please add GEMINI_API_KEY to your .env file.',
    });
  }

  try {
    const movieContext = await getMovieContext();

    const systemPrompt = `You are CineBot 🎬, the friendly AI assistant for CineAndhra — a premium Telugu movie ticket booking platform.

LIVE MOVIE DATA (updated in real-time):
${movieContext}

YOUR ROLE:
- Help users discover and book Telugu movies
- Recommend movies based on mood, genre, actors, duration preferences
- Answer questions about showtimes, theaters, prices, and seats
- Guide users through the booking process (login → select show → pick seats → pay)
- Keep responses concise, enthusiastic, and cinema-themed
- Use emojis sparingly but effectively
- Always answer in the same language the user writes in (English or Telugu)

BOOKING FLOW:
1. Browse movies on the homepage
2. Click "Book Now" on a movie card  
3. Select a showtime and click "Select Seats"
4. Pick your seats on the seat map
5. Proceed to payment
6. View confirmation

AVAILABLE THEATERS: Prasads IMAX (Lower Tank Bund), Devi 70MM (Secunderabad), Asian Cinemas (Kukatpally)

If asked about something outside movies or CineAndhra, politely redirect the conversation to cinema.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: systemPrompt,
    });

    // Build chat history (filter to valid format)
    const validHistory = (history || [])
      .filter(h => h && h.role && h.parts)
      .map(h => ({ role: h.role, parts: h.parts }));

    const chat = model.startChat({ history: validHistory });
    const result = await chat.sendMessage(message.trim());
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (err) {
    console.error('Gemini AI error:', err);
    const msg = err.message || '';
    if (msg.includes('API_KEY') || msg.includes('API key')) {
      return res.status(503).json({ error: 'Invalid Gemini API key. Please check your .env file.' });
    }
    res.status(500).json({ error: 'AI assistant is temporarily unavailable. Please try again.' });
  }
}

module.exports = { chatWithAI };
