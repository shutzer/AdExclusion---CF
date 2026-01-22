
# AdExclusion Enterprise 🚀

**AdExclusion Enterprise** je administrativni alat dizajniran za news portale visoke posjećenosti.

## 🚀 Cloudflare Pages Dashboard Postavke

Ako sustav zahtijeva unos svih polja, unesite ove vrijednosti:

1. **Build command**: `echo "Skip build"`
2. **Build output directory**: `.`
3. **Deploy command**: `npx wrangler pages deploy . --project-name adexclusion-manager`

### KV Binding (Obavezno)
U postavkama Pages-a pod **Settings > Functions > KV namespace bindings**:
- **Variable name**: `AD_EXCLUSION_KV`
- **KV namespace**: Izaberite vaš kreirani namespace.

---
*Digital Ops Team.*
