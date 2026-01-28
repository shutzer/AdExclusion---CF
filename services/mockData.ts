
import { BlacklistRule, AuditLogEntry, Operator } from '../types.ts';

export const MOCK_RULES: BlacklistRule[] = [
  {
    id: 'mock-1',
    name: 'Heineken: Euro 2026 Sponsorship',
    // Fix: Using Operator.EQUALS enum member instead of string literal 'equals'
    conditions: [{ targetKey: 'section', operator: Operator.EQUALS, value: 'sport', caseSensitive: false }],
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
    // Fix: Using Operator.EQUALS enum member instead of string literal 'equals'
    conditions: [{ targetKey: 'top_section', operator: Operator.EQUALS, value: 'vijesti', caseSensitive: false }],
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
      // Fix: Using Operator.EQUALS enum member instead of string literal 'equals'
      { targetKey: 'section', operator: Operator.EQUALS, value: 'tehnologija', caseSensitive: false },
      // Fix: Using Operator.CONTAINS enum member instead of string literal 'contains'
      { targetKey: 'keywords', operator: Operator.CONTAINS, value: 'gaming, konzole', caseSensitive: false }
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
    // Fix: Using Operator.CONTAINS enum member instead of string literal 'contains'
    conditions: [{ targetKey: 'keywords', operator: Operator.CONTAINS, value: 'vatreni, hns, nogomet', caseSensitive: false }],
    logicalOperator: 'AND',
    targetElementSelector: '.footer-takeover-logo',
    action: 'hide',
    isActive: true,
    respectAdsEnabled: false,
    createdAt: Date.now() - 400000
  }
];

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: Date.now() - 1000 * 60 * 5, // prije 5 min
    user: 'admin',
    action: 'PUBLISH_PROD',
    details: 'Objavljena skripta na produkciju. Aktivno 14 pravila.',
    snapshotId: 'snap_prod_latest'
  },
  {
    id: 'log-2',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // prije 2h
    user: 'user',
    action: 'ROLLBACK',
    details: 'Hitni povratak na verziju od jučer zbog greške u selektoru.',
    snapshotId: 'snap_yesterday_stable'
  },
  {
    id: 'log-3',
    timestamp: Date.now() - 1000 * 60 * 60 * 4, // prije 4h
    user: 'admin',
    action: 'TOGGLE',
    details: 'Pravilo "Ožujsko: Reprezentacija Campaign" je privremeno isključeno.',
    snapshotId: 'snap_toggle_oz'
  },
  {
    id: 'log-4',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // prije 1 dan
    user: 'user',
    action: 'UPDATE',
    details: 'Ažurirani keywords za Heineken kampanju (dodano: "euro2026").',
    snapshotId: 'snap_heineken_v2'
  },
  {
    id: 'log-5',
    timestamp: Date.now() - 1000 * 60 * 60 * 25, // prije 1 dan i 1h
    user: 'admin',
    action: 'CREATE',
    details: 'Kreirano novo pravilo: "Disney+: Showbiz Takeover".',
    snapshotId: 'snap_disney_init'
  },
  {
    id: 'log-6',
    timestamp: Date.now() - 1000 * 60 * 60 * 48, // prije 2 dana
    user: 'admin',
    action: 'PUBLISH_DEV',
    details: 'Testna objava na DEV okruženje uspješna.',
    snapshotId: 'snap_dev_test'
  }
];
