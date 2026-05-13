import type { Category } from './playbooks';

export interface LlmsPlaybook {
  readonly slug: string;
  readonly category: Category;
  readonly from: string;
  readonly to: string;
  readonly description: string;
}
