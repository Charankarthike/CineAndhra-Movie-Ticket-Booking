# CineAndhra: Premium Movie Ticket Booking System
## Presentation Slides

---

### Slide 1: Title Slide
**Title:** CineAndhra - Premium Movie Ticket Booking System
**Subtitle:** Redefining the Cinematic Experience with AI
**Presenter:** [Your Name / Team Name]
**Date:** [Date]

---

### Slide 2: Introduction & Problem Statement
**Heading:** The Need for a Better Booking Experience
* **Traditional Systems:** Many movie booking platforms have cluttered interfaces, lack personalization, and offer poor customer support.
* **The Goal:** Create a premium, intuitive, and visually stunning movie ticket booking platform.
* **Our Solution:** CineAndhra—a full-stack web application featuring a sleek dark/gold aesthetic, seamless seat selection, and an integrated AI assistant.

---

### Slide 3: Key Features
**Heading:** Core Capabilities of CineAndhra
* **Premium User Interface:** Cinematic dark theme with gold accents for an immersive feel.
* **Real-time Seat Selection:** Interactive seat grid with status indicators (Available, Selected, Booked).
* **AI-Powered Chatbot:** "CineBot" for personalized movie recommendations and instant query resolution.
* **Secure Authentication:** JWT-based user and admin login.
* **Simulated Payment Gateway:** End-to-end checkout flow with payment success/failure simulation.

---

### Slide 4: Technology Stack
**Heading:** Built with Modern Technologies
* **Frontend:** HTML5, CSS3 (Vanilla for maximum flexibility), JavaScript (Fetch API).
* **Backend:** Node.js, Express.js (MVC Architecture).
* **Database:** MySQL 8+ (InnoDB) with transaction and row-locking capabilities for reliable seat booking.
* **AI Integration:** Google Gemini API for the intelligent floating chatbot.
* **Security:** bcrypt for password hashing, JWT for API protection.

---

### Slide 5: System Architecture
**Heading:** How CineAndhra Works under the Hood
* **Client-Server Model:** Frontend communicates with the Node.js API.
* **Routing & Controllers:** Express handles routing (`/movies`, `/seats`, `/book`) and passes logic to controllers.
* **Concurrency Control:** MySQL transactions ensure two users cannot book the same seat simultaneously.
* **State Management:** Seat reservations expire automatically after a TTL to free up abandoned bookings.

---

### Slide 6: Database Design
**Heading:** Relational Data Structure
* **Users:** Stores customer and admin credentials securely.
* **Movies & Theaters:** Central catalog of regional (Telugu) and mainstream movies, linked to theater locations.
* **Shows:** Schedules linking movies, theaters, and specific timings.
* **Seats & Bookings:** Tracks individual seat states (`available`, `reserved`, `booked`) per show and links them to user payment records.

---

### Slide 7: AI Integration: CineBot
**Heading:** Smart Assistance on the Go
* **Floating Widget:** Accessible from anywhere on the platform without disrupting the booking flow.
* **Personalized Recommendations:** Suggests movies based on genre, language, and user preferences.
* **Instant Support:** Answers FAQs about showtimes, ticket availability, and booking processes.
* **Tech:** Powered by Gemini AI, fine-tuned with context about the CineAndhra database.

---

### Slide 8: The Booking Flow
**Heading:** A Seamless Customer Journey
1. **Browse & Discover:** User explores the movie catalog and views details/posters.
2. **Select Showtime:** Chooses a preferred theater and time.
3. **Pick Seats:** Interacts with the visual seat grid to select tickets.
4. **Checkout & Pay:** Reviews the order (calculated in ₹ INR) and proceeds to simulated payment.
5. **Confirmation:** Receives an instant booking summary with ticket details.

---

### Slide 9: Admin Dashboard
**Heading:** Powerful Management Tools
* **Movie Management:** Add, update, or remove movies and their poster URLs.
* **Show Scheduling:** Create new shows and automatically generate theater seating grids.
* **Booking Overview:** View and manage all user reservations and ticket sales across the platform.

---

### Slide 10: Future Scope & Conclusion
**Heading:** What's Next for CineAndhra?
* **Real Payment Gateway Integration:** Connecting Stripe or Razorpay for live transactions.
* **Mobile Application:** Expanding the web platform to native iOS and Android apps.
* **Multi-Language Support:** Adding regional language toggles beyond Telugu and English.
* **Conclusion:** CineAndhra demonstrates a robust, scalable, and highly interactive approach to modern web applications, elevated by AI.

---
**Thank You!**
*(Open for Q&A)*
