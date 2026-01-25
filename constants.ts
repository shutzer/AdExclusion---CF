import { TargetingKey, Operator } from './types';

export const TARGETING_KEYS: { label: string; value: TargetingKey }[] = [
  { label: 'Portal (Site)', value: 'site' },
  { label: 'Ključne riječi (Keywords)', value: 'keywords' },
  { label: 'Rubrika (Section)', value: 'section' },
  { label: 'Glavna rubrika (Top Section)', value: 'top_section' },
  { label: 'Vrsta stranice (Page Type)', value: 'page_type' },
  { label: 'ID Članka (Content ID)', value: 'content_id' },
  { label: 'Puna adresa (URL)', value: 'description_url' },
  { label: 'Domena (Domain)', value: 'domain' },
  { label: 'AB Test', value: 'ab_test' },
  { label: 'Oglasi (Ads Enabled)', value: 'ads_enabled' }
];

export const OPERATORS = [
  { label: 'Jednako (==)', value: Operator.EQUALS },
  { label: 'NIJE Jednako (!=)', value: Operator.NOT_EQUALS },
  { label: 'Sadrži', value: Operator.CONTAINS },
  { label: 'NE Sadrži', value: Operator.NOT_CONTAINS }
];