
# AdExclusion Enterprise 🚀

**AdExclusion Enterprise** je optimiziran za Cloudflare Pages Git-integritaciju.

## ✅ Cloudflare Dashboard Konfiguracija

Budući da koristimo isti kod za različita okruženja, **KV bindinge je potrebno ručno postaviti** u Cloudflare Dashboardu.

### 1. Bindings (Settings > Functions)

**ZA PRODUKCIJSKI PROJEKT (PROD):**
1. Otiđite na **Settings** > **Functions**.
2. Pod **KV Namespace Bindings** dodajte:
   - **Variable name:** `AD_EXCLUSION_KV`
   - **KV namespace:** Odaberite svoj *glavni produkcijski KV*.

**ZA STAGING / DEV PROJEKT:**
1. Otiđite na **Settings** > **Functions**.
2. Pod **KV Namespace Bindings** dodajte:
   - **Variable name:** `AD_EXCLUSION_KV_DEV`
   - **KV namespace:** Odaberite `AD_EXCLUSION_KV_DEV` (ili onaj koji završava na `...c1207`).

*Objašnjenje: Kod automatski traži `AD_EXCLUSION_KV`. Ako ga ne nađe (jer smo na Stageu), traži `AD_EXCLUSION_KV_DEV`. Ovime osiguravamo da Stage nikada ne može pisati po Produkciji.*

### 2. Variables and Secrets (Settings > Environment variables)
Dodajte ove varijable pod **Secrets** (encrypted) za oba okruženja:

| Variable Name | Description | Mandatory |
| :--- | :--- | :--- |
| `ADMIN_PASS` | Lozinka za pristup admin sučelju (SuperAdmin, username: `admin`) | **DA** |
| `USER_PASS` | Lozinka za pristup standardnog korisnika (username: `user`) | **NE** |
| `CF_API_TOKEN` | API Token sa dozvolom `Zone.Cache Purge` | DA |
| `CF_ZONE_ID` | ID Zone vaše domene | DA |
| `CF_PURGE_URL` | URL Produkcijske skripte (npr. `.../exclusions/sponsorship_exclusions.js`) | DA |
| `CF_PURGE_URL_DEV` | URL Development skripte (npr. `.../exclusions/sponsorship_exclusions-dev.js`) | DA |

### Workflow Okruženja
1. **DRAFT**: Sva pravila se automatski spremaju u radni prostor prilikom uređivanja.
2. **OBJAVI NA DEV**: Šalje trenutna pravila na `/exclusions/sponsorship_exclusions-dev.js`.
3. **OBJAVI NA PROD**: Šalje pravila na `/exclusions/sponsorship_exclusions.js`.

---
*Senior Systems Architect*
