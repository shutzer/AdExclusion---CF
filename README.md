
# AdExclusion Enterprise 🚀

**AdExclusion Enterprise** je optimiziran za Cloudflare Pages Git-integritaciju.

## ✅ Cloudflare Dashboard Konfiguracija

Kako bi Build, Login i Purge radili ispravno, potrebno je podesiti sljedeće u Cloudflare Dashboardu:

### 1. Bindings (Settings > Functions)
**PRODUKCIJSKI PROJEKT:**
- **KV Namespace Binding**: 
  - Variable name: `AD_EXCLUSION_KV`
  - KV namespace: Glavni produkcijski KV.

**STAGING / DEV PROJEKT:**
- **KV Namespace Binding**: 
  - Variable name: `AD_EXCLUSION_KV_DEV`
  - KV namespace: `AD_EXCLUSION_KV_DEV` (ID: 2b0b48a8f41b4d02ad878ea0181c1207).

*Napomena: Backend automatski prepoznaje koji je KV dostupan i koristi ga.*

### 2. Variables and Secrets (Settings > Environment variables)
Dodajte ove varijable pod **Secrets** (encrypted) za Production i Preview okruženja:

| Variable Name | Description | Mandatory |
| :--- | :--- | :--- |
| `ADMIN_PASS` | Lozinka za pristup admin sučelju (SuperAdmin, username: `admin`) | **DA** |
| `USER_PASS` | Lozinka za pristup standardnog korisnika (username: `user`) | **NE** |
| `CF_API_TOKEN` | API Token sa dozvolom `Zone.Cache Purge` | DA |
| `CF_ZONE_ID` | ID Zone vaše domene | DA |
| `CF_PURGE_URL` | URL Produkcijske skripte (npr. `.../exclusions/sponsorship_exclusions.js`) | DA |
| `CF_PURGE_URL_DEV` | URL Development skripte (npr. `.../exclusions/sponsorship_exclusions-dev.js`) | DA |

### Razine Pristupa (RBAC)
- **admin**: Puni pristup sustavu, uključujući Custom JavaScript Injection.
- **user**: Standardni pristup, ali bez mogućnosti dodavanja ili pregleda Custom JS koda.

### Workflow Okruženja
1. **DRAFT**: Sva pravila se automatski spremaju u radni prostor prilikom uređivanja.
2. **OBJAVI NA DEV**: Šalje trenutna pravila na `/exclusions/sponsorship_exclusions-dev.js`. Koristite ovo za testiranje na portalu bez utjecaja na korisnike.
3. **OBJAVI NA PROD**: Šalje pravila na `/exclusions/sponsorship_exclusions.js`. Ovo je "Live" okruženje.

---
*Senior Systems Architect*
