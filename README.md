
# AdExclusion Enterprise 🚀

**AdExclusion Enterprise** je administrativni alat dizajniran za news portale visoke posjećenosti.

## 🚀 VAŽNO: Cloudflare Pages Konfiguracija

Da bi build uspio, u Cloudflare Dashboardu podesite sljedeće:

1. **Build command**: (ostavite prazno)
2. **Build output directory**: `/`
3. **Deploy command**: (ostavite prazno - NEMOJTE upisivati `wrangler deploy`)

### KV Binding
Obavezno u postavkama Pages-a pod **Bindings** povežite:
- **Variable name**: `AD_EXCLUS_KV` (ili kako je u kodu) 
- **KV namespace**: Izaberite vaš kreirani namespace.

---
*Digital Ops Team.*
