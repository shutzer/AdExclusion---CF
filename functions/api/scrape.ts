
type PagesFunction<Env = any> = (context: {
  request: Request;
  env: Env;
  [key: string]: any;
}) => Response | Promise<Response>;

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const { url } = await context.request.json();

    if (!url || !url.startsWith('http')) {
      return new Response(JSON.stringify({ success: false, message: "Neispravan URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Sigurnosna provjera domene
    const allowedDomains = ['dnevnik.hr', 'gol.hr', 'zimo.hr', 'zadovoljna.hr', 'punkufer.hr'];
    const urlObj = new URL(url);
    const domainMatch = allowedDomains.some(d => urlObj.hostname.endsWith(d));

    if (!domainMatch) {
      return new Response(JSON.stringify({ success: false, message: "Scraping dozvoljen samo za Nova TV portale" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AdExclusionBot/3.0'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, message: `Portal nije dostupan (Status ${response.status})` }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    const html = await response.text();
    
    // OPTIMIZACIJA: Tražimo 'targeting' ključ direktno bez parsiranja cijelog HTML-a
    // Tražimo "targeting": { ili targeting: {
    const targetingIndex = html.indexOf('"targeting":');
    const fallbackIndex = html.indexOf('targeting:');
    const startIndex = targetingIndex !== -1 ? targetingIndex : fallbackIndex;

    if (startIndex === -1) {
       return new Response(JSON.stringify({ success: false, message: "Na stranici nije pronađen 'targeting' blok" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Uzimamo idućih 2000 znakova (dovoljno za targeting objekt, štedi CPU)
    const contextSnippet = html.substring(startIndex, startIndex + 2500);

    // Helper za čupanje vrijednosti pomoću mini-regexa na malom stringu
    const extractField = (field: string) => {
      const regex = new RegExp(`['"]?${field}['"]?\\s*:\\s*['"]([^'"]*)['"]`);
      const match = contextSnippet.match(regex);
      return match ? match[1] : "";
    };

    // Poseban helper za keywords (podržava nizove)
    const extractKeywords = () => {
      const regex = /keywords\s*:\s*\[([\s\S]*?)\]/;
      const match = contextSnippet.match(regex);
      if (!match) return [];
      return match[1]
        .split(',')
        .map(k => k.replace(/['"\s\[\]]/g, ''))
        .filter(k => k.length > 0);
    };

    // Detekcija oglasa
    const adsEnabled = !contextSnippet.includes('ads_enabled: false') && 
                       !contextSnippet.includes('"ads_enabled": false') &&
                       !contextSnippet.includes('ads_enabled:false');

    const extractedData = {
      site: extractField('site'),
      keywords: extractKeywords(),
      description_url: url,
      ads_enabled: adsEnabled,
      page_type: extractField('page_type'),
      content_id: extractField('content_id'),
      domain: urlObj.hostname,
      section: extractField('section'),
      top_section: extractField('top_section'),
      ab_test: extractField('ab_test')
    };

    // Validacija - ako nismo našli ni site ni rubriku, nešto nije u redu
    if (!extractedData.site && !extractedData.section) {
       return new Response(JSON.stringify({ success: false, message: "Podaci pronađeni, ali format je nepoznat" }), {
        status: 422,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "Greška pri obradi podataka", error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
