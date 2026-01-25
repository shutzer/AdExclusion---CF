
export const MOCK_RULES = [
  {
    id: 'mock-1',
    name: 'Heineken: Euro 2026 Sponsorship',
    conditions: [{ targetKey: 'section', operator: 'equals', value: 'sport', caseSensitive: false }],
    logicalOperator: 'AND',
    targetElementSelector: '.bg-branding-main',
    action: 'hide',
    isActive: true,
    respectAdsEnabled: true,
    createdAt: Date.now() - 100000
  },
  {
    id: 'mock-2',
    name: 'Mastercard: News Exclusive',
    conditions: [{ targetKey: 'top_section', operator: 'equals', value: 'vijesti', caseSensitive: false }],
    logicalOperator: 'AND',
    targetElementSelector: '#top-banner-wrap',
    action: 'hide',
    isActive: true,
    respectAdsEnabled: true,
    createdAt: Date.now() - 200000
  },
  {
    id: 'mock-3',
    name: 'PlayStation 6: Tech Launch',
    conditions: [
      { targetKey: 'section', operator: 'equals', value: 'tehnologija', caseSensitive: false },
      { targetKey: 'keywords', operator: 'contains', value: 'gaming, konzole', caseSensitive: false }
    ],
    logicalOperator: 'OR',
    targetElementSelector: '.article-sidebar-promo',
    action: 'hide',
    isActive: false,
    respectAdsEnabled: true,
    createdAt: Date.now() - 300000
  },
  {
    id: 'mock-4',
    name: 'Ožujsko: Reprezentacija Campaign',
    conditions: [{ targetKey: 'keywords', operator: 'contains', value: 'vatreni, hns, nogomet', caseSensitive: false }],
    logicalOperator: 'AND',
    targetElementSelector: '.footer-takeover-logo',
    action: 'hide',
    isActive: true,
    respectAdsEnabled: false,
    createdAt: Date.now() - 400000
  },
  {
    id: 'mock-5',
    name: 'Tesla: Lifestyle Clean',
    conditions: [{ targetKey: 'section', operator: 'equals', value: 'lifestyle', caseSensitive: false }],
    logicalOperator: 'AND',
    targetElementSelector: '.native-ad-unit',
    action: 'show',
    isActive: true,
    respectAdsEnabled: true,
    createdAt: Date.now() - 500000
  },
  {
    id: 'mock-6',
    name: 'Nike: Gol.hr Running Focus',
    conditions: [
      { targetKey: 'site', operator: 'equals', value: 'gol', caseSensitive: false },
      { targetKey: 'keywords', operator: 'contains', value: 'trčanje', caseSensitive: false }
    ],
    logicalOperator: 'AND',
    targetElementSelector: '.branding-header-wrap',
    action: 'hide',
    isActive: true,
    respectAdsEnabled: true,
    createdAt: Date.now() - 600000
  },
  {
    id: 'mock-7',
    name: 'Disney+: Showbiz Takeover',
    conditions: [{ targetKey: 'section', operator: 'equals', value: 'show-business', caseSensitive: false }],
    logicalOperator: 'AND',
    targetElementSelector: '.interstitial-ad-container',
    action: 'hide',
    isActive: true,
    respectAdsEnabled: true,
    createdAt: Date.now() - 700000
  },
  {
    id: 'mock-8',
    name: 'Samsung: S25 Ultra Promo',
    conditions: [
      { targetKey: 'page_type', operator: 'equals', value: 'article', caseSensitive: false },
      { targetKey: 'section', operator: 'equals', value: 'tehnologija', caseSensitive: false }
    ],
    logicalOperator: 'AND',
    targetElementSelector: '#mid-article-mpu',
    action: 'hide',
    isActive: false,
    respectAdsEnabled: true,
    createdAt: Date.now() - 800000
  },
  {
    id: 'mock-9',
    name: 'Coca-Cola: Christmas Spirit',
    conditions: [{ targetKey: 'keywords', operator: 'contains', value: 'blagdani, recepti', caseSensitive: false }],
    logicalOperator: 'OR',
    targetElementSelector: '.floating-video-ad',
    action: 'hide',
    isActive: true,
    respectAdsEnabled: true,
    createdAt: Date.now() - 900000
  },
  {
    id: 'mock-10',
    name: 'Volvo: Safety First',
    conditions: [{ targetKey: 'keywords', operator: 'contains', value: 'sigurnost, auto', caseSensitive: false }],
    logicalOperator: 'AND',
    targetElementSelector: '.wallpaper-ad-left, .wallpaper-ad-right',
    action: 'hide',
    isActive: true,
    respectAdsEnabled: false,
    createdAt: Date.now() - 1000000
  }
];
