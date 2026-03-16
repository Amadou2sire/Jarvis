# Jarvis - Assistant Personnel IA Avancé

Jarvis est un agent personnel intelligent conçu pour Telegram. Il combine les capacités des meilleurs modèles de langage (LLM) avec des services cloud pour une mémoire infinie et une interface vocale naturelle.

## Caractéristiques & Micro-services

Le projet est articulé autour de plusieurs briques technologiques performantes :

### 1. Cerveau (Agent IA)
*   **LLM** : Utilise Groq (Llama 3) ou OpenRouter pour des réponses instantanées et intelligentes.
*   **Outils embarqués** :
    *   **Météo** : Prévisions en temps réel via OpenWeatherMap.
    *   **Recherche Web** : Capacités de recherche approfondie via Tavily ou SerpAPI (Style NotebookLM).
    *   **Gestion du restaurant** : Scan de menus sur Google Drive, recommandations de plats et prise de commandes.
    *   **Gestion du temps** : Horloge mondiale en temps réel.

### 2. Cloud Memory & Automation
*   **Firebase Firestore** : Sauvegarde toute la mémoire des conversations, les menus et les commandes.
*   **Google Drive** : Intégration pour lire les menus du jour depuis un dossier partagé.
*   **Tâches planifiées** : Synchronisation automatique du menu depuis Drive toutes les heures via Firebase Functions.
*   **Profils Utilisateurs** : Stocke les préférences, les statistiques d'utilisation et l'historique complet.

### 3. Interface Vocale (Multimodale)
*   **STT (Speech-To-Text)** : Transcription ultra-rapide des messages vocaux via **Groq Whisper**.
*   **TTS (Text-To-Speech)** : Synthèse vocale fluide avec plusieurs fournisseurs (Speechify, Google Cloud, ElevenLabs).

### 4. Interface Telegram
*   **Bot API** : Piloté par la bibliothèque `grammy`.
*   **Commandes** : Gestion avancée des commandes utilisateur (/history, /stats, /sync, /clear).

---

## 🛠️ Écosystème des APIs utilisées

Chaque API joue un rôle crucial dans le fonctionnement de Jarvis :

| API / Service | Rôle dans le projet |
| :--- | :--- |
| **Telegram Bot API** | Interface principale de communication avec l'utilisateur. |
| **Groq (Llama 3)** | Cerveau de l'agent : compréhension, raisonnement et utilisation des outils. |
| **Groq (Whisper)** | Oreilles de Jarvis : conversion ultra-rapide des messages vocaux en texte. |
| **Google Drive API** | Lecture et extraction automatique des menus depuis des documents cloud. |
| **Firebase Firestore** | Mémoire à long terme : stockage confidentiel des discussions et des commandes. |
| **Google Cloud TTS** | Voix premium masculine pour les réponses audio de Jarvis. |
| **Speechify (Raphaël)** | Alternative de synthèse vocale haute fidélité. |
| **Tavily / SerpApi** | Extension des connaissances de Jarvis via des recherches web en temps réel. |
| **OpenWeatherMap** | Fournisseur de données météorologiques précises. |
| **Firebase Functions** | Hébergement serveur et déclenchement des tâches automatiques. |

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
# Telegram
TELEGRAM_BOT_TOKEN="votre_token"
TELEGRAM_ALLOWED_USER_IDS="votre_id_telegram" # Votre ID utilisateur

# Cerveau & Recherche
GROQ_API_KEY="votre_cle_groq"
TAVILY_API_KEY="votre_cle"
OPENWEATHERMAP_API_KEY="votre_cle"

# Services de Voix (TTS)
SPEECHIFY_API_KEY="votre_cle"
ELEVENLABS_API_KEY="votre_cle"

# Infrastructure & Restaurant
GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
MENU_FOLDER_ID="id_du_dossier_google_drive"
```

### 4. Lancer le projet
```bash
# Mode développement (Long Polling)
npm run dev

# Déploiement Cloud (Webhooks & Scheduled Tasks)
npm run deploy
```

---

## Commandes Bot
*   `/start` — Présentation de Jarvis et ses capacités.
*   `/history` — Affiche l'historique récent de la conversation (depuis le Cloud).
*   `/stats` — Statistiques d'utilisation (nombre de messages, ancienneté).
*   `/sync` — Force la synchronisation immédiate des documents du dossier Google Drive.
*   `/clear` — Efface la mémoire de la conversation dans le cloud.

---

## Sécurité & Confidentialité
Jarvis est verrouillé pour n'accepter que les messages provenant des IDs Telegram autorisés. Vos données (discussions, menus, commandes) sont stockées de manière isolée dans Firebase et protégées par des règles de sécurité strictes interdisant tout accès client direct.
