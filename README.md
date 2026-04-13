# CodeLearning Hub

CodeLearning is an advanced technical reference and interactive learning hub designed for software engineers. It moves beyond basic syntax tutorials to focus on architectural patterns, system design, and advanced programming paradigms.

## 🚀 Core Modules

The hub is divided into four primary engineering domains:

1. **Web Architecture (`web.html`)**
   - Client-Side: Rendering patterns (SSR, SSG, CSR, ISR), state management, and modern toolchains (Vite, Turbopack).
   - Server-Side: Distributed systems (REST, GraphQL, gRPC), caching strategies (Redis), and AppSec fundamentals.

2. **Object-Oriented Design (`oop.html`)**
   - Core Principles: Composition over inheritance, SOLID principles, and tactical Domain-Driven Design (Entities, Value Objects, Aggregates).
   - Design Patterns: Creational, Structural, and Behavioral patterns with practical use cases.

3. **Mobile Engineering (`mobile.html`)**
   - Native OS: iOS (Swift/SwiftUI) and Android (Kotlin/Jetpack Compose) architectures.
   - Cross-Platform: Deep dives into Flutter's rendering engine (Impeller) and React Native's New Architecture (JSI, Fabric).

4. **Event-Driven Systems (`eop.html`)**
   - Asynchronous I/O: The Node.js Event Loop, Microtasks, and Promise orchestration.
   - Event Architecture: Message brokers (RabbitMQ vs. Kafka), WebSockets, and Server-Sent Events (SSE).

## ⚔️ Practice Arena (AI Integration)

The platform includes an interactive **Practice Arena** (`practice.html`) that dynamically generates coding challenges based on the selected domain and difficulty level. 

### AI Architecture
To ensure security and prevent exposing API keys on the client-side, the Practice Arena communicates with a **Cloudflare Worker proxy** (`codelearning.owensanrios.workers.dev`). 

1. The client requests a scenario (e.g., "Advanced SOLID Principles").
2. The request hits the Cloudflare Worker.
3. The Worker securely appends the API key and queries the **Google Gemini API** enforcing strict JSON output.
4. The JSON payload is parsed and rendered locally without markdown formatting issues.

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML5, CSS3 (Custom Properties, Grid/Flexbox), and ES6+ JavaScript.
- **Design System:** Zero dependencies. Fully responsive custom dark-theme UI tailored for desktop and mobile reading.
- **Backend/Proxy:** Cloudflare Workers (Serverless).
- **LLM:** Google Gemini Flash/Pro APIs.

## 📦 Local Setup

Because the project relies on standard web technologies, no build step is strictly required for the frontend.

1. Clone the repository.
2. Serve the directory using any local web server to prevent CORS issues with local file loading:
   ```bash
   python3 -m http.server 8000
   # OR
   npx serve .