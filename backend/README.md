# CheckmateAI 

**CheckmateAI** is a cutting-edge, real-time misinformation detection system designed to combat fake news and viral rumors using advanced AI agents. Built with **FastAPI**, **LangGraph**, **Supabase**, **Neo4j**, and **Google Gemini 2.0 Flash**.

## System Architecture

CheckmateAI operates using a multi-agent architecture:

### 1. Verification Agent
A reactive agent that verifies user-submitted claims in real-time.

**Capabilities:**
- Text claim verification
- **Multimodal verification** (image + text) using Gemini 2.0 Flash vision
- Credibility-weighted source scoring
- Detailed analysis with confidence scores
- Intensity classification (low/medium/high)
- Similar claim detection via vector embeddings

**Workflow (LangGraph):**
1. **Check Worthiness**: Filters opinions, questions, and non-verifiable statements
2. **Gather Evidence**: Parallel search across fact-checkers (Tavily AI)
3. **Generate Verdict**: AI analysis with credibility weighting
4. **Find Similar**: Vector similarity search for related claims
5. **Save Result**: Persist to Supabase with embeddings

### 2. Threat Feed Agent
A background intelligence agent that monitors the web for trending misinformation.

**Capabilities:**
- Multi-source RSS aggregation (10+ fact-checkers)
- **Graph-based trend detection** using Neo4j
- Centrality algorithms for viral pattern detection
- Real-time threat scoring and intensity classification
- Topic clustering and relationship mapping

**Sources:**
- Snopes, PolitiFact, FactCheck.org (US)
- AltNews, BoomLive, Factly, Vishvas News (India)
- FullFact (UK)
- Reuters Fact Check, Lead Stories (International)

### 3. Vaccine Agent
A proactive agent that generates weekly immunity digests.

**Capabilities:**
- Weekly digest generation with top 5 threats
- **Multilingual support** (en, hi, es, fr, etc.)
- Enriched format with spread velocity and regional impact
- Historical archive with view tracking

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | FastAPI (Async Python) |
| AI Model | Google Gemini 2.0 Flash |
| Orchestration | LangGraph |
| Search Tool | Tavily AI |
| Database | Supabase (PostgreSQL + pgvector) |
| Graph DB | Neo4j Aura |
| Scheduling | APScheduler |
| Feed Parsing | Feedparser |

---

## Prerequisites

- **Python 3.11+**
- **Supabase Account** (free tier works)
- **Neo4j Aura Account** (optional, for graph features)
- **API Keys:**
  - Google AI Studio (Gemini)
  - Tavily AI

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/checkmateai.git
cd checkmateai
```

### 2. Create Virtual Environment
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
# Required
GOOGLE_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Optional (for graph features)
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# App Settings
APP_ENV=development
DEBUG=true
FEED_UPDATE_INTERVAL_MINUTES=10
```

### 5. Set Up Supabase Database
Run the SQL schema in your Supabase SQL Editor:
```bash
# Copy contents of app/db/schema.sql to Supabase SQL Editor and execute
```

---

## Running the Application

```bash
uvicorn app.main:app --reload
```

The server will start at `http://localhost:8000`.

### API Documentation
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## API Endpoints

### Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verify` | Verify a claim (text or image+text) |
| GET | `/api/verify/history` | Get verification history |
| GET | `/api/verify/{id}` | Get specific verification |
| GET | `/api/verify/similar/{id}` | Find similar claims |

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/verify" \
  -H "Content-Type: application/json" \
  -d '{"text": "Drinking bleach cures COVID-19", "language": "en"}'
```

**Example Response:**
```json
{
  "verdict": "False",
  "confidence": 95.5,
  "intensity": "high",
  "summary": "This claim is dangerous misinformation...",
  "detailed_analysis": "Multiple fact-checkers have debunked...",
  "sources": [
    {
      "url": "https://snopes.com/...",
      "title": "Bleach Does Not Cure COVID",
      "credibility_score": 95,
      "snippet": "..."
    }
  ],
  "processing_time_ms": 2341,
  "verification_id": "uuid"
}
```

### Threat Feed

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feed` | Get trending threats |
| GET | `/api/feed/intensity/{level}` | Filter by intensity |
| GET | `/api/feed/trending` | Get top trending |
| GET | `/api/feed/topics` | Get topic clusters |
| POST | `/api/feed/refresh` | Trigger manual refresh |

### Vaccine Digest

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vaccine/latest` | Get latest digest |
| GET | `/api/vaccine/archive` | Get past digests |
| POST | `/api/vaccine/trigger-now` | Generate new digest |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health check |
| GET | `/` | API info |

---

## Project Structure

```
app/
├── main.py                     # FastAPI app entry point
├── core/
│   ├── config.py               # Environment configuration
│   └── llm.py                  # Gemini LLM setup
├── models/
│   └── schemas.py              # Pydantic request/response models
├── agents/
│   ├── verification_agent/     # Fact-checking agent
│   │   ├── graph.py            # LangGraph workflow
│   │   ├── state.py            # State definition
│   │   ├── tools.py            # Search tools
│   │   └── credibility.py      # Source scoring
│   ├── feed_agent/             # Threat monitoring agent
│   │   ├── agent.py            # RSS fetcher
│   │   └── graph_analysis.py   # Neo4j operations
│   └── vaccine_agent/          # Digest generator
│       └── agent.py            # Weekly digest logic
├── routers/                    # API route handlers
│   ├── verify.py
│   ├── feed.py
│   ├── vaccine.py
│   └── health.py
└── db/
    ├── supabase.py             # Supabase client
    ├── neo4j.py                # Neo4j client
    └── schema.sql              # Database schema
```

---

## Credibility Scoring

Sources are scored based on their reliability:

| Tier | Score | Examples |
|------|-------|----------|
| 1 (Highest) | 90-100 | Snopes, Reuters, AFP, FactCheck.org |
| 2 | 85-90 | AltNews, BoomLive, Lead Stories |
| 3 | 80-90 | BBC, NYTimes, NPR |
| 4 | 85-95 | WHO, CDC, Nature, Science |
| 5 | 70 | Wikipedia |
| Low | 20-40 | Social media, blogs |

---

## Background Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Feed Update | Every 10 min | Fetches RSS feeds, updates threats |
| Vaccine Generation | Sunday 9 AM | Creates weekly digest |

---

## Troubleshooting

### "ModuleNotFoundError"
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`

### Supabase Connection Error
- Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Check if pgvector extension is enabled

### Neo4j Connection Error
- Neo4j is optional - app works without it
- Verify credentials in `.env`

### Feed Agent Not Updating
- Check scheduler logs
- Verify internet connection
- Some RSS feeds may be blocked

---

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

---

## License

MIT License

---

**Built with love by the CheckmateAI Team**
