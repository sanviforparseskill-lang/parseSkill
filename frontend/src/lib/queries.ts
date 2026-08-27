import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type {
  ChatMessageEnqueued,
  ChatMessageOut,
  CurrentUser,
  GraphSkillsOut,
  PortfolioConfigOut,
  PortfolioConfigUpdate,
  ProfileOut,
  ProfileUpdate,
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
  SyncTriggerResponse,
  VerificationTokenOut,
} from "./types";

// ---- auth / profile ----

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<CurrentUser>("/auth/me"),
    retry: false,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<ProfileOut>("/profile"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileUpdate) => api.patch<ProfileOut>("/profile", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useVerificationToken() {
  return useQuery({
    queryKey: ["profile", "verification-token"],
    queryFn: () => api.get<VerificationTokenOut>("/profile/verification-token"),
  });
}

export function useLinkAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ platform, handle, verificationToken }: { platform: string; handle: string; verificationToken?: string }) =>
      api.post<ProfileOut>(`/profile/link/${platform}`, { handle, verification_token: verificationToken }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUnlinkAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platform: string) => api.delete<ProfileOut>(`/profile/link/${platform}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUploadResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.postForm<ResumeParseResult>("/profile/resume", form);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", "resume"] }),
  });
}

export function useResumeParse() {
  return useQuery({
    queryKey: ["profile", "resume"],
    queryFn: () => api.get<ResumeParseResult>("/profile/resume"),
  });
}

export function useResumeAudit() {
  return useQuery({
    queryKey: ["profile", "resume", "audit"],
    queryFn: () => api.get<ResumeAuditOut>("/profile/resume/audit"),
  });
}

// ---- skills ----

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: () => api.get<SkillOut[]>("/skills"),
  });
}

export function useSkillEvidence(skillId: string | null) {
  return useQuery({
    queryKey: ["skills", skillId, "evidence"],
    queryFn: () => api.get<SkillEvidence>(`/skills/${skillId}/evidence`),
    enabled: !!skillId,
  });
}

// ---- projects ----

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<ProjectOut[]>("/projects"),
  });
}

export function useProject(projectId: string | null) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => api.get<ProjectDetail>(`/projects/${projectId}`),
    enabled: !!projectId,
  });
}

// ---- timeline ----

export function useTimeline() {
  return useQuery({
    queryKey: ["timeline"],
    queryFn: () => api.get<import("./types").TimelineOut>("/timeline"),
  });
}

// ---- recommendations / roadmap ----

export function useRolePredictions() {
  return useQuery({
    queryKey: ["recommendations", "roles"],
    queryFn: () => api.get<RolePrediction[]>("/recommendations/roles"),
  });
}

export function useSkillGap(roleId: string | null) {
  return useQuery({
    queryKey: ["recommendations", "gap", roleId],
    queryFn: () => api.get<SkillGapItem[]>(`/recommendations/gap/${roleId}`),
    enabled: !!roleId,
  });
}

export function useProjectIdeas() {
  return useQuery({
    queryKey: ["recommendations", "projects"],
    queryFn: () => api.get<ProjectIdea[]>("/recommendations/projects"),
  });
}

export function useRoadmap(roleId: string | null) {
  return useQuery({
    queryKey: ["roadmap", roleId],
    queryFn: () => api.get<RoadmapSkill[]>(`/roadmap/${roleId}`),
    enabled: !!roleId,
  });
}

export function useSetRoadmapStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, roleId, status }: { skillId: string; roleId: string; status: string }) =>
      api.patch(`/roadmap/skill/${skillId}/status?role_id=${roleId}&status=${status}`),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["roadmap", vars.roleId] }),
  });
}

// ---- portfolio ----

export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: () => api.get<PortfolioConfigOut>("/portfolio"),
  });
}

export function useUpdatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PortfolioConfigUpdate) => api.patch<PortfolioConfigOut>("/portfolio", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function usePublishPortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isPublic: boolean) => api.post<PortfolioConfigOut>(`/portfolio/publish?is_public=${isPublic}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function usePublicPortfolio(handle: string) {
  return useQuery({
    queryKey: ["public", handle],
    queryFn: () => api.get<PublicPortfolio>(`/public/@${handle}`),
    enabled: !!handle,
    retry: false,
  });
}

// ---- graph ----

export function useGraphSkills() {
  return useQuery({
    queryKey: ["graph", "skills"],
    queryFn: () => api.get<GraphSkillsOut>("/graph/skills"),
  });
}

// ---- sync ----

export function useTriggerSync() {
  return useMutation({
    mutationFn: () => api.post<SyncTriggerResponse>("/sync/trigger"),
  });
}

export function useSyncHistory() {
  return useQuery({
    queryKey: ["sync", "history"],
    queryFn: () => api.get<SyncLogEntry[]>("/sync/history"),
  });
}

// ---- chat ----

export function useChatHistory() {
  return useQuery({
    queryKey: ["chat", "history"],
    queryFn: () => api.get<ChatMessageOut[]>("/chat/history"),
  });
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: (content: string) => api.post<ChatMessageEnqueued>("/chat/message", { content }),
  });
}

export function useClearChatHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/chat/history"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "history"] }),
  });
}
