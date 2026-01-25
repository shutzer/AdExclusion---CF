
import { authService } from './authService.ts';

// ISTA LOGIKA: Sve što nije produkcija je DEV.
const hostname = window.location.hostname;
const IS_PROD = hostname.includes('pages.dev') || hostname.includes('dnevnik.hr');
const IS_DEV = !IS_PROD;

export const dataService = {
  async getRules() {
    if (IS_DEV) {
      console.log("[DataService] Returning mock rules...");
      return {
        rules: [
          {
            id: 'mock-1',
            name: 'Mock: Heineken Euro 2026',
            conditions: [{ targetKey: 'section', operator: 'equals', value: 'sport', caseSensitive: false }],
            logicalOperator: 'AND',
            targetElementSelector: '.bg-branding-main',
            action: 'hide',
            isActive: true,
            respectAdsEnabled: true,
            createdAt: Date.now()
          },
          {
            id: 'mock-2',
            name: 'Mock: Sakrij Banner na Naslovnici',
            conditions: [{ targetKey: 'page_type', operator: 'equals', value: 'home', caseSensitive: false }],
            logicalOperator: 'AND',
            targetElementSelector: '#banner-top',
            action: 'hide',
            isActive: false,
            respectAdsEnabled: false,
            createdAt: Date.now()
          }
        ]
      };
    }

    try {
      const response = await fetch('/api/sync', {
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}` 
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          authService.logout();
          throw new Error("Session expired");
        }
        return { rules: [] };
      }

      return response.json();
    } catch (e) {
      console.error("DataService Error:", e);
      return { rules: [] };
    }
  },

  async saveRules(rules: any[], script?: string) {
    if (IS_DEV) {
      console.log("🛠️ Dev Mode: Pravila spremljena (mock)", rules);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    }

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ rules, script })
      });

      if (!response.ok) throw new Error("Sync failed");
      return response.json();
    } catch (e) {
      return { success: false, message: String(e) };
    }
  },

  async scrapeUrl(url: string) {
    if (IS_DEV) {
      console.log(`🛠️ Dev Mode: Scraping ${url} (mock)`);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const isSport = url.includes('sport') || url.includes('gol');
      
      return {
        success: true,
        data: {
          site: isSport ? 'gol' : 'dnevnik',
          keywords: isSport ? ['Nogomet', 'HNS', 'Dinamo'] : ['Vijesti', 'Hrvatska', 'Politika'],
          description_url: url,
          ads_enabled: true,
          page_type: 'article',
          content_id: 'art_' + Math.floor(Math.random() * 100000),
          domain: new URL(url).hostname,
          section: isSport ? 'sport' : 'vijesti',
          top_section: isSport ? 'sport' : 'vijesti',
          ab_test: 'default'
        }
      };
    }

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ url })
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        const text = await response.text().catch(() => "Unknown error");
        try {
          const json = JSON.parse(text);
          return { success: false, message: json.message || "Greška scrapera" };
        } catch {
          return { success: false, message: "Problem u komunikaciji s Edge funkcijom (Timeout ili CPU limit)." };
        }
      }

      return await response.json();
    } catch (e) {
      return { success: false, message: "Mrežna greška pri povezivanju sa scraperom." };
    }
  },

  async purgeCache() {
    if (IS_DEV) return { success: true };
    try {
      const response = await fetch('/api/purge', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      return response.json();
    } catch (e) {
      return { success: false };
    }
  }
};
