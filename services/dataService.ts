
import { authService } from './authService.ts';
import { MOCK_RULES } from './mockData.ts';

const hostname = window.location.hostname;
const IS_PROD = hostname.includes('pages.dev') || hostname.includes('dnevnik.hr');
const IS_DEV = !IS_PROD;

export const dataService = {
  async getRules() {
    if (IS_DEV) {
      return {
        rules: MOCK_RULES
      };
    }

    try {
      const response = await fetch('/api/sync', {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) return { rules: [] };
      return response.json();
    } catch (e) {
      console.error("Sync fetch failed", e);
      return { rules: [] };
    }
  },

  async saveRules(rules: any[], script?: string) {
    if (IS_DEV) return { success: true };
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ rules, script })
      });
      return response.json();
    } catch (e) {
      return { success: false, message: String(e) };
    }
  },

  async scrapeUrl(url: string) {
    if (IS_DEV) {
      await new Promise(r => setTimeout(r, 600));
      return { success: true, data: { site: 'gol', keywords: ['Test'], ads_enabled: true } };
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
      if (!response.ok) {
        let msg = `Server Error ${response.status}`;
        try {
          const errData = await response.json();
          msg = errData.message || msg;
        } catch { /* ignore */ }
        return { success: false, message: msg };
      }

      if (!contentType || !contentType.includes("application/json")) {
        return { success: false, message: "Server nije vratio JSON (vjerojatno Cloudflare 5xx greška)" };
      }

      return await response.json();
    } catch (e: any) {
      console.error("Scrape network error:", e);
      return { success: false, message: `Mrežna greška: ${e.message || "Nepoznata greška"}` };
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
