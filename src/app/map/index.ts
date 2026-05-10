/**
 * Module 1.1 — Public API
 * Exports for use by Module 1.3 (Transit Map) and other modules.
 */

export { IssueCard } from './components/IssueCard'
export { issueStore, useIssues } from './store/issues'
export type { Issue, IssueFilter, IssueCategory, IssueStatus, Comment, Review } from './types'
