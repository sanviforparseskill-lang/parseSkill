// Mirrors backend/app/schemas/*.py response models field-for-field.

export type CurrentUser = {
  id: string;
  github_handle: string;
  display_name: string | null;
  avatar_url: string | null;
  onboarded: boolean;
};

export type ProfileOut = {
  id: string;
  github_handle: string;
  leetcode_handle: string | null;
  codeforces_handle: string | null;
  kaggle_handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  tagline: string | null;
  location: string | null;
  coding_score: number | null;
  project_quality_score: number | null;
  consistency_score: number | null;
  learning_velocity: number | null;
  last_synced_at: string | null;
};

export type ProfileUpdate = Partial<{
  display_name: string;
  tagline: string;
  bio: string;
  location: string;
}>;

export type VerificationTokenOut = {
  token: string;
  instructions: Record<string, string>;
};

type ResumeEducation = { institution: string | null; degree: string | null; field: string | null; year: string | null };
type ResumeWorkExperience = { company: string | null; title: string | null; start_date: string | null; end_date: string | null; description: string | null };

export type ResumeParseResult = {
  education: ResumeEducation[];
  work_experience: ResumeWorkExperience[];
  projects: { name: string | null; description: string | null }[];
  skills_claimed: string[];
  corroborated_skills: string[];
  parsed_at: string | null;
};

export type ResumeAuditEvidenceRepo = { project_id: string; repo_full_name: string; weight: number };

export type ResumeAuditSkill = {
  name: string;
  implemented: boolean;
  confidence: number | null;
  evidence_repos: ResumeAuditEvidenceRepo[];
};

export type ResumeAuditOut = {
  parsed_at: string | null;
  skills: ResumeAuditSkill[];
  credibility_score: number | null;
  education: ResumeEducation[];
  work_experience: ResumeWorkExperience[];
};

export type SkillOut = {
  id: string;
  name: string;
  category: string;
  confidence: number;
  first_evidence_date: string | null;
  evidence_count: number;
};

export type EvidenceRepo = {
  project_id: string;
  repo_full_name: string;
  weight: number;
  technologies: string[];
};

export type SkillEvidence = {
  skill_id: string;
  skill_name: string;
  confidence: number;
  breadth: number;
  depth: number;
  recency: number;
  diversity: number;
  evidence_repos: EvidenceRepo[];
};

export type ProjectOut = {
  id: string;
  repo_full_name: string;
  description: string | null;
  primary_language: string | null;
  stars: number;
  forks: number;
  is_fork: boolean;
  is_template_derived: boolean;
  contribution_weight: number | null;
  complexity_score: number | null;
  last_commit_at: string | null;
  top_technologies: string[];
};

export type ProjectDetail = ProjectOut & {
  complexity_breakdown: Record<string, number>;
  technologies: { name: string; weight: number; category: string }[];
  architecture_patterns: string[];
  concepts_demonstrated: string[];
  skill_contributions: { skill_name: string; weight: number }[];
  readme_excerpt: string | null;
};

export type TimelineCell = {
  technology_id: string;
  technology_name: string;
  category: string;
  quarter: string;
  commit_count: number;
};

export type TimelineMilestone = {
  type: string;
  technology_id: string;
  technology_name: string;
  date: string;
  label: string;
};

export type TimelineOut = {
  cells: TimelineCell[];
  milestones: TimelineMilestone[];
  learning_velocity: { quarter: string; new_technologies: number }[];
};

export type RolePrediction = {
  role_id: string;
  role_name: string;
  confidence: number;
  description: string | null;
};

export type SkillGapItem = {
  skill_id: string;
  skill_name: string;
  importance: number;
  priority_score: number;
  already_have: boolean;
};

export type ProjectIdea = {
  title: string;
  description: string;
  skills_exercised: string[];
  complexity: number;
  estimated_hours: number;
  why_this_project: string;
};

export type RoadmapSkill = {
  skill_id: string;
  skill_name: string;
  order_index: number;
  estimated_hours: number;
  status: "not_started" | "learning" | "done";
  project_idea: string | null;
};

export type PortfolioConfigOut = {
  is_public: boolean;
  slug: string | null;
  theme: string;
  sections: Record<string, unknown> | null;
  featured_project_ids: string[];
};

export type PortfolioConfigUpdate = Partial<{
  theme: string;
  sections: Record<string, unknown>;
  featured_project_ids: string[];
  slug: string;
}>;

export type PublicPortfolio = {
  handle: string;
  display_name: string | null;
  tagline: string | null;
  avatar_url: string | null;
  theme: string;
  sections: Record<string, unknown> | null;
  top_projects: { repo_full_name: string; description: string | null; complexity_score: number }[];
  top_role: { role_id: string; role_name: string; confidence: number } | null;
};

export type ChatMessageOut = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Record<string, unknown>[] | null;
  created_at: string;
};

export type ChatMessageEnqueued = { message_id: string };

export type ChatToken = { token: string; done: boolean; citations: Record<string, unknown>[] | null };

export type SyncTriggerResponse = { job_id: string };

export type SyncStatus = { job_id: string; status: string; attempts: number; last_error: string | null };

export type SyncLogEntry = {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  sources_synced: string[];
  repos_processed: number | null;
  new_technologies_count: number | null;
  new_skills_count: number | null;
  error_message: string | null;
};

export type SyncProgressEvent = { stage: string; job_id?: string; [key: string]: unknown };

// Cytoscape-ready graph JSON from GET /graph/skills (app/db/raw.py::skill_graph_json).
export type GraphNode = {
  data: { id: string; label: string; type: "skill" | "technology" | "project"; confidence?: number; category?: string | null };
};
export type GraphEdge = {
  data: { source: string; target: string; weight: number };
};
export type GraphSkillsOut = { nodes: GraphNode[]; edges: GraphEdge[] };
