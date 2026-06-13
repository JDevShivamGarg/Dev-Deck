# DevDeck 🚀

[![Download APK](https://img.shields.io/badge/Download-Android_APK-C3F400?style=for-the-badge&logo=android&logoColor=050505&labelColor=111111)](https://expo.dev/accounts/depresseddeveloper/projects/devdeck/builds/dd21c52a-fe70-4b66-8823-da4cd96345af)

![DevDeck Demo Preview](https://img.shields.io/badge/Status-Active-brightgreen.svg)
![Expo](https://img.shields.io/badge/Expo-54.0-black.svg?style=flat&logo=expo)
![React Native](https://img.shields.io/badge/React_Native-0.81-blue.svg?style=flat&logo=react)
![SQLite](https://img.shields.io/badge/SQLite-Local_First-003B57.svg?style=flat&logo=sqlite)

**DevDeck** (formerly TechFlash) is a production-ready, brutalist-themed mobile application designed for software engineers and IT professionals to accelerate learning through advanced Spaced Repetition (SRS) and dynamic AI content generation. 

Built entirely offline-first using React Native, Expo, and local SQLite persistence, DevDeck guarantees a hyper-fast, distraction-free studying experience that scales dynamically using custom AI pipelines.

---

## ✨ Key Features

* **Offline-First Architecture**: All cards, progress metrics, and scheduling algorithms are processed locally via Expo SQLite. Zero reliance on continuous cloud syncing.
* **Intelligent Spaced Repetition (SRS)**: Employs a finely-tuned spaced repetition algorithm to optimize memory retention, adjusting review intervals dynamically based on your historical performance.
* **Comprehensive Progress Tracking**: Keep yourself accountable with customizable daily goals, streak tracking, and a detailed session history tab.
* **Advanced Card Management**: Search through your decks, export cards to JSON via clipboard, manually adjust card difficulties post-session, and retire/unretire cards you've mastered. 
* **Hybrid AI Content Generation**: 
  * **Automatic Generation**: Connect your Groq API key to generate entire decks (MCQs, Flashcards, Scenario-based Questions) on-the-fly using a customizable unified prompt.
  * **Bring Your Own LLM (BYO-LLM)**: Prefer ChatGPT or Claude? Copy the perfectly structured, pre-generated system prompt directly to your clipboard, paste the JSON response back into the app, and instantly inject custom topics.
* **Context-Aware Deduplication**: The AI generation engine is natively aware of existing cards in your database to ensure you never generate duplicate questions.
* **Brutalist Terminal Aesthetics**: A heavily stylized, high-contrast, developer-centric UI utilizing strict 8px grid alignments, custom typography, and dynamic safe area handling.
* **Three Modes of Assessment**:
  * **MCQ**: Multiple-choice evaluation.
  * **Flashcard**: Traditional spaced repetition.
  * **Scenario**: Real-world debugging and code-snippet analysis.

---

## 🛠 Tech Stack

* **Framework**: React Native with Expo SDK 54
* **Routing**: Expo Router v3 (File-based routing)
* **Database**: `expo-sqlite` (Local persistence)
* **State Management**: `zustand`
* **Animations**: `react-native-reanimated`
* **List Optimization**: `@shopify/flash-list`
* **AI Integration**: Groq API (`llama-3.3-70b-versatile`)

---

## ⚙️ Installation & Setup

### Prerequisites
* Node.js (v18+)
* npm or yarn
* Expo CLI
* Expo Go app on your physical device (or Xcode/Android Studio for simulators)

### 1. Clone the repository
```bash
git clone https://github.com/JDevShivamGarg/Dev-Deck.git
cd Dev-Deck
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
To enable automatic AI generation, create a `.env` file in the root directory and add your Groq API key:

```env
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
```
*(Note: If you omit this, you can still use the manual BYO-LLM copy/paste flow).*

### 4. Start the Development Server
```bash
npx expo start -c
```
Press `a` to run on Android, `i` to run on iOS, or scan the QR code with your phone's camera (iOS) or Expo Go app (Android).

---

## 🧠 AI Content Generation Workflow

DevDeck provides two powerful ways to expand your knowledge base dynamically:

### Option 1: Automatic (Groq API)
1. Ensure your `EXPO_PUBLIC_GROQ_API_KEY` is configured.
2. Tap **+** on the home screen to create a new topic, or select **GENERATE MORE CARDS** on an existing topic.
3. Paste any documentation, code snippets, or notes into the Material field.
4. Tap **GENERATE VIA GROQ**. The app will automatically parse the AI response and seed your database.

### Option 2: Manual (BYO-LLM)
1. Tap **+** on the home screen or **GENERATE MORE CARDS** on an existing topic.
2. Provide your source material.
3. Tap **COPY PROMPT TO CLIPBOARD**.
4. Paste the prompt into ChatGPT, Claude, or any LLM of your choice.
5. Copy the raw JSON response provided by the LLM.
6. Paste the JSON back into DevDeck's input field and tap **IMPORT CARDS**.

---

## 📂 Project Structure

```text
├── app/                  # Expo Router file-based routing
│   ├── (tabs)/           # Bottom tab navigation (Feed, Trends, History, Profile)
│   ├── session/          # Active study session screens (MCQ, Flashcard, Setup)
│   └── topic/            # Topic creation, card generation, and management screens
├── src/                  # Application source code
│   ├── ai/               # Prompt builders and LLM parsing logic
│   ├── components/       # Reusable UI components (Cards, Buttons, etc.)
│   ├── data/             # Static seed data for built-in topics
│   ├── db/               # SQLite schema, queries, and migrations
│   ├── hooks/            # Custom React hooks (useSession, useDueCards)
│   ├── srs/              # Spaced Repetition scheduling algorithms
│   ├── store/            # Zustand global state management
│   └── theme/            # Brutalist design system tokens (colors, typography)
```

---

## 🤝 Contributing

Contributions are always welcome! If you have ideas for new features, better SRS tuning, or UI improvements:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
