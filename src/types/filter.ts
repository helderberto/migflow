export interface PlaybookSearchFields {
  readonly from: string;
  readonly to: string;
  readonly tags: string;
  readonly description: string;
  readonly category: string;
}

export type CategoryFilter = string | 'all';
