Ce document est **un guide détaillé et le prompt fondamental** pour construire **Jarvis**, ton propre **agent d’intelligence artificielle personnel**.

Contrairement aux solutions existantes ou aux dépendances complexes, **Jarvis** est conçu pour être **un agent entièrement personnalisé**, **sécurisé** et **fonctionnant localement**, en utilisant **Telegram comme interface de communication vocale**.

Si tu veux :

* comprendre **l’architecture d’un agent IA**,
* avoir **un contrôle total sur ses données et ses fonctionnalités**,
* et **l’exécuter sur ton propre matériel**,

alors tu es au bon endroit.

Nous allons nous concentrer sur :

* **la simplicité**
* **la modularité**
* **la sécurité**

et cela **dès le premier commit**.

Prépare-toi à faire **le premier pas vers la création d’une IA qui pense, agit et se souvient**, tout cela **sous ton contrôle**. 


Tu m’aides à construire **Jarvis**, un **agent d’IA personnel créé depuis zéro**, qui fonctionne **localement** et utilise **Telegram comme interface vocale**.

Ce **n’est pas un fork** de solutions existantes.
C’est **une implémentation propre**, simple, sécurisée et **entièrement sous mon contrôle**.

---

# Objectif

Créer un agent capable de :

* Communiquer avec moi via **Telegram** (Mode 100% voix) 🤖🎙️
* **Raisonner avec un LLM** (Groq / OpenRouter)
* **Exécuter des outils** (Heure, Météo via Open-Meteo, Recherche Web via Tavily)
* **Mémoriser des informations de façon persistante** (SQLite)
* **Fonctionner entièrement en local**
* **Synthèse vocale premium** avec Speechify (Voix Raphaël)
* **Recherche approfondie** (Style NotebookLM) pour répondre aux questions complexes

---

# Exigences obligatoires

* **TypeScript (ES modules)**
* **Architecture modulaire et claire**
* **Pas de serveur web** (utiliser **Telegram long polling**)
* **Whitelist des Telegram user ID**
* **Identifiants dans `.env`**
* **Mémoire persistante avec SQLite**
* **Agent loop avec limite d’itérations**
* **Pas de skills externes non vérifiées**
* **La sécurité comme priorité**

---

# Stack

* **grammy** → bot Telegram
* **Groq API** → LLM principal (Modèle : `llama-3.3-70b-versatile`)
* **OpenRouter** → Fallback LLM (avec sanitisation stricte des champs)
* **Speechify SDK** (`@speechify/api`) → Synthèse vocale principale
* **better-sqlite3** → mémoire persistante
* **tsx** → exécution en développement
* **Open-Meteo** → Service météo gratuit
* **Tavily API** → Moteur de recherche conçu pour les agents IA

---

# Fondation

Toutes les clés doivent être ajoutées dans un fichier **`.env`**

```
TELEGRAM_BOT_TOKEN=""
TELEGRAM_ALLOWED_USER_IDS=""
GROQ_API_KEY=""
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="openrouter/free"
DB_PATH="./memory.db"
GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
elevenlabs_api_key=""
SPEECHIFY_API_KEY=""
ELEVENLABS_API_KEY=""
OPENROUTER_API_KEY=""
TAVILY_API_KEY=""
SERPAPI_API_KEY=""
WHISPER_API_KEY="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"
# Note: Open-Meteo utilisé pour la météo (pas besoin de OpenWeatherMap)
```

---

# Générer un projet complet fonctionnel incluant

* Un **bot Telegram opérationnel** (Réponse audio uniquement)
* Une **intégration avec Groq comme LLM principal**
  (OpenRouter avec filtrage des champs `refusal`/`reasoning_details`)
* Un **agent loop basique**
* **Outils fonctionnels : Geocoding, Heure, Météo (Open-Meteo), Recherche (Tavily/SerpApi)**
* Une **structure complète de dossiers**
* Prêt à être exécuté avec :

```
npm install
npm run dev
```

---

# Contraintes de conception

Prioriser :

* **la simplicité**
* **la clarté**
* **la sécurité**

Générer **tout le code nécessaire**.

Enfin, rendre l’architecture **évolutive**, car dans de futures itérations l’utilisateur pourrait demander :

* un fonctionnement **dans le cloud** (Firebase ou similaire) ☁️
* l’ajout d’outils de **transcription audio** 🎙️
* **text-to-speech** (ex : ElevenLabs) 🔊
* la connexion à **d’autres canaux ou outils** pour donner **plus de capacités à l’agent**.
