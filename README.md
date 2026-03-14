# Jarvis - Assistant Personnel IA Avancé

Jarvis est un agent personnel intelligent conçu pour Telegram. Il combine les capacités des meilleurs modèles de langage (LLM) avec des services cloud pour une mémoire infinie et une interface vocale naturelle.

## Caractéristiques & Micro-services

Le projet est articulé autour de plusieurs briques technologiques performantes :

### 1. Cerveau (Agent IA)
*   **LLM** : Utilise Groq (Llama 3) ou OpenRouter pour des réponses instantanées et intelligentes.
*   **Outils embarqués** :
    *   **Météo** : Prévisions en temps réel via Open-Meteo.
    *   **Recherche Web** : Capacités de recherche approfondie via Tavily ou SerpAPI (Style NotebookLM).
    *   **Gestion du temps** : Horloge mondiale en temps réel.

### 2. Cloud Memory (Persistence)
*   **Firebase Firestore** : Sauvegarde toute la mémoire des conversations dans le cloud.
*   **Profils Utilisateurs** : Stocke les préférences, les statistiques d'utilisation et l'historique complet.
*   **Sécurité** : Accès restreint via Firebase Admin SDK pour garantir la confidentialité des données.

### 3. Interface Vocale (Multimodale)
*   **STT (Speech-To-Text)** : Transcription ultra-rapide des messages vocaux via **Groq Whisper**.
*   **TTS (Text-To-Speech)** : Synthèse vocale fluide avec plusieurs fournisseurs (Speechify, Google Cloud, ElevenLabs).

### 4. Interface Telegram
*   **Bot API** : Piloté par la bibliothèque `grammy`.
*   **Commandes** : Gestion avancée des commandes utilisateur (/history, /stats, /clear).

---

## Installation

### Prérequis
*   Node.js (v18+)
*   Un compte Firebase & un fichier `service-account.json`
*   Un Token Bot Telegram (via @BotFather)
*   Des clés API (Groq, Tavily, etc.)

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd telegram
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
Créez un fichier `.env` à la racine :
```env
TELEGRAM_BOT_TOKEN="votre_token"
TELEGRAM_ALLOWED_USER_IDS="votre_id_telegram"
GROQ_API_KEY="votre_cle_groq"
OPENROUTER_API_KEY="votre_cle"
DB_PATH="./memory.db"
GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
SPEECHIFY_API_KEY="votre_cle"
OPENWEATHERMAP_API_KEY="votre_cle"
TAVILY_API_KEY="votre_cle"
```

### 4. Lancer le projet
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

---

## Commandes Bot
*   `/start` — Présentation de Jarvis et ses capacités.
*   `/history` — Affiche l'historique récent de la conversation (depuis le Cloud).
*   `/stats` — Statistiques d'utilisation (nombre de messages, ancienneté).
*   `/clear` — Efface la mémoire de la conversation dans le cloud.

---

## Sécurité
Jarvis est verrouillé pour n'accepter que les messages provenant des IDs Telegram spécifiés dans `TELEGRAM_ALLOWED_USER_IDS`. Vos données Firestore sont protégées par des règles interdisant tout accès client direct.
