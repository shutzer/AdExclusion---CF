
# AdExclusion Enterprise 🚀

**AdExclusion Enterprise** je optimiziran za Cloudflare Pages.

## ⚠️ KRITIČNO: Setup Okruženja

Kako bi imali potpunu kontrolu nad PROD i DEV okruženjima, **ne koristimo `wrangler.toml`** u repozitoriju.

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
*   Variable name: **`AD_EXCLUSION_KV_DEV`**
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

---
*Senior Systems Architect*
