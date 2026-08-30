import { clearDemoMode } from "@/lib/demo-mode";
import demoDataset from "@/demo-fixtures/demo-sanvi.json";
import type {
  ChatMessageOut,
  CurrentUser,
  GraphSkillsOut,
  PortfolioConfigOut,
  ProfileOut,
  ProjectDetail,
  ProjectIdea,
  ProjectOut,
  PublicPortfolio,
  ResumeAuditOut,
  ResumeParseResult,
  RoadmapSkill,
  RolePrediction,
  SkillEvidence,
  SkillGapItem,
  SkillOut,
  SyncLogEntry,
  TimelineOut,
  VerificationTokenOut,
} from "@/lib/types";

type DemoDataset = {
  meta: {
    profile_label: string;
    generated_at: string;
    source: string;
    sanitized: boolean;
  };
  auth: { me: CurrentUser };
  profile: ProfileOut;
  verification_token: VerificationTokenOut;
  resume_parse: ResumeParseResult;
  resume_audit: ResumeAuditOut;
  skills: SkillOut[];
  skill_evidence: Record<string, SkillEvidence>;
  projects: ProjectOut[];
  project_details: Record<string, ProjectDetail>;
  timeline: TimelineOut;
  recommendations: {
    roles: RolePrediction[];
    gap_by_role: Record<string, SkillGapItem[]>;
    projects: ProjectIdea[];
  };
  roadmap_by_role: Record<string, RoadmapSkill[]>;
  portfolio: PortfolioConfigOut;
  public_portfolio: PublicPortfolio;
  graph_skills: GraphSkillsOut;
  sync: {
    history: SyncLogEntry[];
  };
  chat: {
    history: ChatMessageOut[];
    canned_replies: string[];
  };
  extras?: {
    quiz_results?: unknown[];
    career_report?: Record<string, unknown> | null;
    roadmap_progress?: Record<string, unknown> | null;
    exam_calendar?: unknown[];
    dashboard_stats?: Record<string, unknown> | null;
    effort_score?: Record<string, unknown> | null;
    streak?: Record<string, unknown> | null;
  };
};

type DemoRuntimeState = {
  profile: ProfileOut;
  authMe: CurrentUser;
  verificationToken: VerificationTokenOut;
  resumeParse: ResumeParseResult;
  resumeAudit: ResumeAuditOut;
  skills: SkillOut[];
  skillEvidence: Record<string, SkillEvidence>;
  projects: ProjectOut[];
  projectDetails: Record<string, ProjectDetail>;
  timeline: TimelineOut;
  roles: RolePrediction[];
  gapByRole: Record<string, SkillGapItem[]>;
  projectIdeas: ProjectIdea[];
  roadmapByRole: Record<string, RoadmapSkill[]>;
  portfolio: PortfolioConfigOut;
  publicPortfolio: PublicPortfolio;
  graphSkills: GraphSkillsOut;
  syncHistory: SyncLogEntry[];
  chatHistory: ChatMessageOut[];
  cannedReplies: string[];
  pendingChatStreams: Record<string, { token: string; done: boolean; citations: Record<string, unknown>[] | null }[]>;
};

let datasetPromise: Promise<DemoDataset> | null = null;
let runtimeStatePromise: Promise<DemoRuntimeState> | null = null;
let seq = 1000;
let cannedReplyIndex = 0;
let demoEventSourceInstalled = false;

class DemoApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function loadDataset(): Promise<DemoDataset> {
  if (!datasetPromise) {
    datasetPromise = Promise.resolve(demoDataset as DemoDataset);
  }
  return datasetPromise;
}

async function getState(): Promise<DemoRuntimeState> {
  if (!runtimeStatePromise) {
    runtimeStatePromise = loadDataset().then((dataset) => ({
      profile: clone(dataset.profile),
      authMe: clone(dataset.auth.me),
      verificationToken: clone(dataset.verification_token),
      resumeParse: clone(dataset.resume_parse),
      resumeAudit: clone(dataset.resume_audit),
      skills: clone(dataset.skills),
      skillEvidence: clone(dataset.skill_evidence),
      projects: clone(dataset.projects),
      projectDetails: clone(dataset.project_details),
      timeline: clone(dataset.timeline),
      roles: clone(dataset.recommendations.roles),
      gapByRole: clone(dataset.recommendations.gap_by_role),
      projectIdeas: clone(dataset.recommendations.projects),
      roadmapByRole: clone(dataset.roadmap_by_role),
      portfolio: clone(dataset.portfolio),
      publicPortfolio: clone(dataset.public_portfolio),
      graphSkills: clone(dataset.graph_skills),
      syncHistory: clone(dataset.sync.history),
      chatHistory: clone(dataset.chat.history),
      cannedReplies: clone(dataset.chat.canned_replies),
      pendingChatStreams: {},
    }));
  }
  return runtimeStatePromise;
}

function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

function parseBody(options: RequestInit): unknown {
  if (!options.body || typeof options.body !== "string") return undefined;
  try {
    return JSON.parse(options.body) as unknown;
  } catch {
    return undefined;
  }
}

function parseRoleStatus(path: string): { roleId: string | null; status: string | null } {
  const [_, query = ""] = path.split("?");
  const qp = new URLSearchParams(query);
  return {
    roleId: qp.get("role_id"),
    status: qp.get("status"),
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function messageEvent(event: string, payload: unknown): MessageEvent {
  return new MessageEvent(event, { data: JSON.stringify(payload) });
}

function parseDemoStreamPath(url: string): string | null {
  const prefix = "demo://stream";
  if (!url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length);
  return path.startsWith("/") ? path : `/${path}`;
}

async function demoStreamEvents(path: string): Promise<Array<{ event: string; payload: unknown; delayMs: number }>> {
  const state = await getState();
  if (path.startsWith("/sync/stream/")) {
    return [
      { event: "progress", payload: { stage: "queued" }, delayMs: 120 },
      { event: "progress", payload: { stage: "collecting_repos" }, delayMs: 280 },
      { event: "progress", payload: { stage: "updating_skill_graph" }, delayMs: 420 },
      { event: "progress", payload: { stage: "done" }, delayMs: 620 },
    ];
  }

  if (path.startsWith("/chat/stream/")) {
    const messageId = path.slice("/chat/stream/".length);
    const tokens = state.pendingChatStreams[messageId];
    if (!tokens) return [];
    delete state.pendingChatStreams[messageId];

    const events: Array<{ event: string; payload: unknown; delayMs: number }> = [];
    let delay = 110;
    for (const token of tokens) {
      events.push({ event: "token", payload: token, delayMs: delay });
      delay += 75;
    }
    return events;
  }

  return [];
}

export async function demoRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const state = await getState();
  const method = (options.method ?? "GET").toUpperCase();

  if (method === "GET" && path === "/auth/me") return clone(state.authMe) as T;
  if (method === "GET" && path === "/profile") return clone(state.profile) as T;
  if (method === "GET" && path === "/profile/verification-token") return clone(state.verificationToken) as T;
  if (method === "GET" && path === "/profile/resume") return clone(state.resumeParse) as T;
  if (method === "GET" && path === "/profile/resume/audit") return clone(state.resumeAudit) as T;
  if (method === "GET" && path === "/skills") return clone(state.skills) as T;
  if (method === "GET" && path === "/projects") return clone(state.projects) as T;
  if (method === "GET" && path === "/timeline") return clone(state.timeline) as T;
  if (method === "GET" && path === "/recommendations/roles") return clone(state.roles) as T;
  if (method === "GET" && path === "/recommendations/projects") return clone(state.projectIdeas) as T;
  if (method === "GET" && path === "/portfolio") return clone(state.portfolio) as T;
  if (method === "GET" && path === "/graph/skills") return clone(state.graphSkills) as T;
  if (method === "GET" && path === "/sync/history") return clone(state.syncHistory) as T;
  if (method === "GET" && path === "/chat/history") return clone(state.chatHistory) as T;

  if (method === "GET" && path.startsWith("/skills/") && path.endsWith("/evidence")) {
    const skillId = path.slice("/skills/".length, -"/evidence".length);
    const evidence = state.skillEvidence[skillId];
    if (!evidence) throw new DemoApiError(404, "No evidence for this skill on this profile");
    return clone(evidence) as T;
  }

  if (method === "GET" && path.startsWith("/projects/")) {
    const projectId = path.slice("/projects/".length);
    const detail = state.projectDetails[projectId];
    if (!detail) throw new DemoApiError(404, "Project not found");
    return clone(detail) as T;
  }

  if (method === "GET" && path.startsWith("/recommendations/gap/")) {
    const roleId = path.slice("/recommendations/gap/".length);
    return clone(state.gapByRole[roleId] ?? []) as T;
  }

  if (method === "GET" && path.startsWith("/roadmap/")) {
    const roleId = path.slice("/roadmap/".length).split("?")[0];
    return clone(state.roadmapByRole[roleId] ?? []) as T;
  }

  if (method === "GET" && path.startsWith("/public/@")) {
    return clone(state.publicPortfolio) as T;
  }

  if (method === "POST" && path === "/auth/signout") {
    clearDemoMode();
    return { ok: true } as T;
  }

  if (method === "PATCH" && path === "/profile") {
    const body = (parseBody(options) as Record<string, string | undefined>) ?? {};
    state.profile = {
      ...state.profile,
      display_name: body.display_name ?? state.profile.display_name,
      tagline: body.tagline ?? state.profile.tagline,
      bio: body.bio ?? state.profile.bio,
      location: body.location ?? state.profile.location,
    };
    state.authMe.display_name = state.profile.display_name;
    return clone(state.profile) as T;
  }

  if (method === "POST" && path.startsWith("/profile/link/")) {
    const platform = path.slice("/profile/link/".length);
    const body = (parseBody(options) as { handle?: string }) ?? {};
    if (!body.handle) throw new DemoApiError(400, "Handle is required");

    if (platform === "leetcode") state.profile.leetcode_handle = body.handle;
    else if (platform === "codeforces") state.profile.codeforces_handle = body.handle;
    else if (platform === "kaggle") state.profile.kaggle_handle = body.handle;
    else throw new DemoApiError(400, `Unsupported platform: ${platform}`);

    return clone(state.profile) as T;
  }

  if (method === "DELETE" && path.startsWith("/profile/link/")) {
    const platform = path.slice("/profile/link/".length);
    if (platform === "leetcode") state.profile.leetcode_handle = null;
    else if (platform === "codeforces") state.profile.codeforces_handle = null;
    else if (platform === "kaggle") state.profile.kaggle_handle = null;
    else throw new DemoApiError(400, `Unsupported platform: ${platform}`);

    return clone(state.profile) as T;
  }

  if (method === "POST" && path === "/profile/resume") {
    return clone(state.resumeParse) as T;
  }

  if (method === "PATCH" && path === "/portfolio") {
    const body = (parseBody(options) as Partial<PortfolioConfigOut>) ?? {};
    state.portfolio = {
      ...state.portfolio,
      ...body,
    };
    if (state.publicPortfolio.sections !== undefined) {
      state.publicPortfolio.sections = state.portfolio.sections;
    }
    if (state.publicPortfolio.theme !== undefined) {
      state.publicPortfolio.theme = state.portfolio.theme;
    }
    return clone(state.portfolio) as T;
  }

  if (method === "POST" && path.startsWith("/portfolio/publish")) {
    const [_, query = ""] = path.split("?");
    const isPublic = new URLSearchParams(query).get("is_public") === "true";
    state.portfolio.is_public = isPublic;
    return clone(state.portfolio) as T;
  }

  if (method === "PATCH" && path.startsWith("/roadmap/skill/")) {
    const skillId = path.slice("/roadmap/skill/".length, path.indexOf("/status"));
    const { roleId, status } = parseRoleStatus(path);
    if (!roleId || !status) throw new DemoApiError(400, "Missing role_id or status");
    const list = state.roadmapByRole[roleId] ?? [];
    const row = list.find((item) => item.skill_id === skillId);
    if (!row) throw new DemoApiError(404, "Roadmap skill not found");
    row.status = status as RoadmapSkill["status"];
    return { skill_id: skillId, role_id: roleId, status: row.status } as T;
  }

  if (method === "POST" && path === "/sync/trigger") {
    const jobId = nextId("job");
    state.syncHistory.unshift({
      id: jobId,
      started_at: nowIso(),
      completed_at: nowIso(),
      status: "success",
      sources_synced: ["github"],
      repos_processed: state.projects.length,
      new_technologies_count: 0,
      new_skills_count: 0,
      error_message: null,
    });
    return { job_id: jobId } as T;
  }

  if (method === "POST" && path === "/chat/message") {
    const body = (parseBody(options) as { content?: string }) ?? {};
    if (!body.content) throw new DemoApiError(400, "Message content is required");

    const userMessageId = nextId("chat-user");
    const assistantMessageId = nextId("chat-assistant");
    const createdAt = nowIso();
    const canned = state.cannedReplies.length > 0
      ? state.cannedReplies[cannedReplyIndex % state.cannedReplies.length]
      : "Your strongest evidence clusters around backend and API architecture; next, focus on one end-to-end ML deployment project to increase role fit breadth.";

    cannedReplyIndex += 1;

    const assistantContent = `${canned}\n\nQuestion asked: \"${body.content}\"`;
    const citations: Record<string, unknown>[] = [
      {
        label: "demo",
        title: "Demo citations",
        items: [
          { label: "source", value: "static demo dataset" },
          { label: "mode", value: "vercel frontend-only" },
        ],
      },
    ];

    state.chatHistory.push({ id: userMessageId, role: "user", content: body.content, citations: null, created_at: createdAt });
    state.chatHistory.push({ id: assistantMessageId, role: "assistant", content: assistantContent, citations, created_at: nowIso() });

    const parts = assistantContent.split(" ");
    const tokens = parts.map((p, idx) => ({
      token: `${idx === 0 ? "" : " "}${p}`,
      done: false,
      citations: null,
    }));
    tokens.push({ token: "", done: true, citations });
    state.pendingChatStreams[userMessageId] = tokens;

    return { message_id: userMessageId } as T;
  }

  if (method === "DELETE" && path === "/chat/history") {
    state.chatHistory = [];
    return { ok: true } as T;
  }

  throw new DemoApiError(404, `No demo handler for ${method} ${path}`);
}

class DemoAwareEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;

  readonly url: string;
  readonly withCredentials: boolean;
  readyState: number;
  onopen: ((this: EventSource, ev: Event) => unknown) | null = null;
  onmessage: ((this: EventSource, ev: MessageEvent) => unknown) | null = null;
  onerror: ((this: EventSource, ev: Event) => unknown) | null = null;

  private delegate: EventSource | null = null;
  private listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  private closed = false;

  constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
    this.url = String(url);
    this.withCredentials = Boolean(eventSourceInitDict?.withCredentials);

    const NativeEventSource = window.__psNativeEventSource;
    const streamPath = parseDemoStreamPath(this.url);

    if (!streamPath) {
      this.delegate = new NativeEventSource(this.url, eventSourceInitDict);
      this.readyState = this.delegate.readyState;
      this.wireNativeDelegate();
      return;
    }

    this.readyState = DemoAwareEventSource.OPEN;
    queueMicrotask(() => {
      if (this.closed) return;
      const event = new Event("open");
      this.onopen?.call(this as unknown as EventSource, event);
      this.dispatch("open", event);
    });

    void this.playDemoStream(streamPath);
  }

  private wireNativeDelegate() {
    if (!this.delegate) return;
    this.delegate.addEventListener("open", (evt) => {
      this.readyState = this.delegate?.readyState ?? this.readyState;
      this.onopen?.call(this as unknown as EventSource, evt);
      this.dispatch("open", evt);
    });
    this.delegate.addEventListener("message", (evt) => {
      this.onmessage?.call(this as unknown as EventSource, evt as MessageEvent);
      this.dispatch("message", evt);
    });
    this.delegate.addEventListener("error", (evt) => {
      this.readyState = this.delegate?.readyState ?? this.readyState;
      this.onerror?.call(this as unknown as EventSource, evt);
      this.dispatch("error", evt);
    });
  }

  private dispatch(type: string, event: Event) {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const listener of set) {
      if (typeof listener === "function") listener.call(this as unknown as EventSource, event);
      else listener.handleEvent(event);
    }
  }

  private async playDemoStream(path: string) {
    const events = await demoStreamEvents(path);
    if (events.length === 0) {
      const err = new Event("error");
      this.onerror?.call(this as unknown as EventSource, err);
      this.dispatch("error", err);
      this.close();
      return;
    }

    for (const item of events) {
      if (this.closed) break;
      await new Promise((resolve) => window.setTimeout(resolve, item.delayMs));
      if (this.closed) break;
      const evt = messageEvent(item.event, item.payload);
      if (item.event === "message") {
        this.onmessage?.call(this as unknown as EventSource, evt);
      }
      this.dispatch(item.event, evt);
    }
    this.close();
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (this.delegate) {
      this.delegate.addEventListener(type, listener);
      return;
    }
    if (!listener) return;
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (this.delegate) {
      this.delegate.removeEventListener(type, listener);
      return;
    }
    if (!listener) return;
    this.listeners.get(type)?.delete(listener);
  }

  close(): void {
    this.closed = true;
    this.readyState = DemoAwareEventSource.CLOSED;
    this.delegate?.close();
  }

  dispatchEvent(event: Event): boolean {
    this.dispatch(event.type, event);
    return true;
  }
}

declare global {
  interface Window {
    __psNativeEventSource: typeof EventSource;
  }
}

export function installDemoEventSourceBridge(): void {
  if (typeof window === "undefined") return;
  if (demoEventSourceInstalled) return;
  if (!window.__psNativeEventSource) {
    window.__psNativeEventSource = window.EventSource;
  }
  window.EventSource = DemoAwareEventSource as unknown as typeof EventSource;
  demoEventSourceInstalled = true;
}
