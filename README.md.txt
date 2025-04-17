# 🧠 Fullstack Aplikacija - Prijava i Upravljanje Korisnicima

Ova aplikacija je izrađena kao rješenje zadatka u okviru tehničkog intervjua. Projekt koristi **ASP.NET Core** za backend i **Vite + React** za frontend.

---

## 🚀 Tehnologije

- **Frontend**: React, Vite, Bootstrap, HTML, CSS
- **Backend**: ASP.NET Core Web API, C#, JWT autentifikacija
- **Baza**: MSSQL
- **Autentifikacija**: JWT, BCrypt hash lozinki
- **Sigurnost**: CORS zaštita, HTTPS, brute-force zaštita

---

## ✅ Implementirane funkcionalnosti

### 🔐 Prijava korisnika (Zadatak 1)

- API endpoint za login
- JWT autentifikacija
- Hashiranje lozinki (BCrypt)
- Ograničeni pokušaji prijave
- Frontend login forma sa validacijom
- JWT čuvanje u `sessionStorage`

### 👥 Upravljanje korisnicima (Zadatak 2)

- API za CRUD operacije (dodavanje, izmjena, pregled, brisanje)
- Promjena statusa korisnika (aktivan/neaktivan)
- Validacija podataka
- Ograničen pristup CRUD funkcijama (samo admin)
- Postoje dvije moguće uloge, Admin i User
- Prikaz korisnika putem DevExpress DataGrid
- Dodavanje, izmjena, brisanje sa potvrdom
- Eksport u CSV, Excel, PDF
- Serverska paginacija, pretraga i filtriranje po statusu

---

## 📦 Pokretanje projekta

### 🖥️ Frontend

```bash
cd imelapp.client
npm install
npm run dev

Otvara se na: https://localhost:51106/

---

### 🖥️ Backend

```bash
cd ImelApp.Server
dotnet restore
dotnet run

Dostupan na: http://localhost:5011
---

## 🛠️ Priprema Baze Podataka

Prije pokretanja backend aplikacije, potrebno je izvršiti migracije baze podataka. To možete učiniti pomoću sljedećih komandi:

### 🖥️ Migracija baze podataka

U backend direktorijumu, otvorite terminal i pokrenite sljedeće komande:

1. **Primjena migracija**:
   ```bash
   dotnet ef database update

Napomena: Prilikom izvršavanja migracija, automatski će biti kreiran jedan administrativni korisnik sa sledećim podacima za prijavu:

Username: admin

Lozinka: 123123
