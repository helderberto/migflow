import type { Category } from '@/types/playbooks';

export interface SubmissionFields {
  readonly from: string;
  readonly to: string;
  readonly category: string;
  readonly tagsRaw: string;
  readonly description: string;
  readonly body: string;
}

export interface ValidSubmission {
  readonly from: string;
  readonly to: string;
  readonly category: Category;
  readonly tags: ReadonlyArray<string>;
  readonly description: string;
  readonly body: string;
}

export type ValidationResult =
  | { readonly ok: true; readonly value: ValidSubmission }
  | { readonly ok: false; readonly error: string };

export interface GitHubUrlInput {
  readonly repo: string;
  readonly branch: string;
  readonly slug: string;
  readonly from: string;
  readonly to: string;
  readonly fileContent: string;
}
