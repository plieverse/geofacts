# GeoFacts

Geopolitiek nieuws delen met vrienden. Een PWA gebouwd met React + Node.js + PostgreSQL.

## Snel starten

### 1. Database opzetten

Zorg dat PostgreSQL draait en maak een database aan:

```bash
createdb geofacts
```

### 2. Server configureren

```bash
cd server
cp .env.example .env
npm install
```

Bewerk `.env` en vul in:
- `DATABASE_URL` — bijv. `postgresql://postgres:wachtwoord@localhost:5432/geofacts`
- `JWT_SECRET` — een willekeurige string
- VAPID keys (genereer met: `npm run generate-vapid`)
- `VAPID_SUBJECT` — bijv. `mailto:jij@voorbeeld.nl`

Database schema + seed data:

```bash
npm run db:init
npm run db:seed
```

### 3. Server starten

```bash
npm run dev
```

Server draait op http://localhost:3001

### 4. Client configureren

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Client draait op http://localhost:5173

## Inloggen

- Voer een voornaam in — geen wachtwoord nodig
- `GeoAdmin` (niet hoofdlettergevoelig) geeft beheerderstoegang

## App installeren (PWA)

Ga naar `/installeren` voor instructies per apparaat.

Voeg de app-iconen toe in `client/public/icons/`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-maskable-512.png` (512×512, maskable)

Zie `client/public/icons/README.txt` voor details.

## Functies

- Geopolitiek nieuws berichten plaatsen met links en onderwerpen
- Like en reageer op berichten
- Push notificaties (Web Push / VAPID)
- PWA — installeerbaar op telefoon en desktop
- Beheerdersdashboard voor `GeoAdmin`
- Volledig in het Nederlands

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + lucide-react
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT (voornaam-only login)
- **Push**: Web Push API (VAPID) + Service Worker
