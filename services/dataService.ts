
import { authService } from './authService.ts';
import { MOCK_RULES, MOCK_AUDIT_LOG } from './mockData.ts';
import { AuditLogEntry } from '../types.ts';

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

  async saveRules(rules: any[], script?: string, target: 'prod' | 'dev' = 'prod') {
    if (IS_DEV) return { success: true };
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ rules, script, target, user: authService.getRole() })
      });
      return response.json();
    } catch (e) {
      return { success: false, message: String(e) };
    }
  },

  async getAuditLog(): Promise<AuditLogEntry[]> {
    if (IS_DEV) {
      // Vraćamo bogatiji set mock podataka za razvoj
      return MOCK_AUDIT_LOG;
    }
    try {
      const response = await fetch('/api/audit', {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.logs || [];
    } catch (e) {
      return [];
    }
  },

  async rollback(snapshotId: string) {
    if (IS_DEV) {
      alert(`Rollback simuliran za Snapshot: ${snapshotId}`);
      return { success: true };
    }
    try {
      const response = await fetch('/api/rollback', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ snapshotId, user: authService.getRole() })
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
        return { success: false, message: "Server nije vratio JSON" };
      }

      return await response.json();
    } catch (e: any) {
      return { success: false, message: `Mrežna greška: ${e.message}` };
    }
  },

  async purgeCache(target: 'prod' | 'dev' = 'prod') {
    if (IS_DEV) return { success: true };
    try {
      const response = await fetch('/api/purge', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}` 
        },
        body: JSON.stringify({ target })
      });
      return response.json();
    } catch (e) {
      return { success: false };
    }
  }
};
