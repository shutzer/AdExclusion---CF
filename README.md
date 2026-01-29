
# AdExclusion Enterprise 🚀

**AdExclusion Enterprise** je optimiziran za Cloudflare Pages.

## ⚠️ KRITIČNO: Setup Okruženja

Kako bi imali potpunu kontrolu nad PROD i STAGE okruženjima, **ne koristimo `wrangler.toml`** u repozitoriju.

1. **Obrišite `wrangler.toml`** ako postoji.
2. Za lokalni razvoj koristimo **`wrangler.local.toml`**.
3. Bindinge postavljamo **ručno** u Cloudflare Dashboardu.

### Lokalni Razvoj
Pokrenite aplikaciju koristeći novu lokalnu konfiguraciju:
```bash
npm run dev
```

### Cloudflare Dashboard Konfiguracija (Manualna)

Budući da smo maknuli `wrangler.toml`, Dashboard će se otključati. Postavite bindinge ovako:

**1. ZA PRODUKCIJSKI PROJEKT (PROD):**
*   Settings > Functions > KV Namespace Bindings
*   Variable name: **`AD_EXCLUSION_KV`**
*   Value: *Vaš PROD KV namespace*

**2. ZA STAGING / DEV PROJEKT:**
*   Settings > Functions > KV Namespace Bindings
*   Variable name: **`AD_EXCLUSION_KV_STAGE`**
*   Value: *Vaš DEV KV namespace*

### Variables and Secrets
Dodajte ove varijable pod **Settings > Environment variables** za oba okruženja:

| Variable Name | Description |
| :--- | :--- |
| `ADMIN_PASS` | Lozinka za pristup admin sučelju |
| `USER_PASS` | Lozinka za pristup standardnog korisnika |
| `CF_API_TOKEN` | API Token (Zone.Cache Purge) |
| `CF_ZONE_ID` | ID Zone |
| `CF_PURGE_URL` | URL Produkcijske skripte |
| `CF_PURGE_URL_DEV` | URL Development skripte |
| `CRON_SECRET` | Tajni ključ za zaštitu Scheduler endpointa |

### ⏰ Postavljanje Schedulera (Cron Trigger)

Budući da je ovo Pages projekt, "Cron Trigger" postavljamo kao vanjski poziv ili Worker koji "pinga" naš API.

1. **Generirajte `CRON_SECRET`** (dugi random string) i spremite ga u Environment Variables.
2. **Kreirajte Cron Trigger** (Može biti Cloudflare Worker ili bilo koji cron servis):

**Primjer Workera za pinganje:**
```javascript
export default {
  async scheduled(event, env, ctx) {
    // Odaberite ispravan target ovisno o okruženju:
    // PROD: ?target=prod
    // STAGE/DEV: ?target=stage
    
    const url = "https://adexclusion.dnevnik.hr/api/scheduler?target=prod"; 
    
    await fetch(url, {
      headers: {
        "x-cron-secret": "VAŠ_CRON_SECRET_OVDJE" // Mora odgovarati onome u Env Variables
      }
    });
  }
};
```
3. Postavite trigger na `* * * * *` (svaku minutu).

### 📝 Kako doći do Cloudflare podataka?

**1. CF_ZONE_ID (ID Zone)**
1. Otvorite Cloudflare Dashboard i odaberite svoju domenu.
2. Na glavnom **Overview** tabu, skrolajte dolje dok s desne strane ne vidite sekciju **API**.
3. Kopirajte vrijednost pod **Zone ID**.

**2. CF_API_TOKEN (Cache Purge Token)**
1. Otiđite na [My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens).
2. Kliknite **Create Token**.
3. Odaberite **Create Custom Token** (na dnu).
4. Imenujte ga (npr. "AdExclusion Purge").
5. Pod **Permissions** dodajte:
   *   `Zone` -> `Cache Purge` -> `Purge`
6. Pod **Zone Resources** odaberite:
   *   `Include` -> `Specific zone` -> *Vaša domena*
7. Kliknite **Continue to Summary** -> **Create Token** i kopirajte ga.

---
*Senior Systems Architect*
