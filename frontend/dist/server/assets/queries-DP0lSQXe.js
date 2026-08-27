import { n as api } from "./api-CdQxeiZX.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
//#region src/lib/queries.ts
function useCurrentUser() {
	return useQuery({
		queryKey: ["auth", "me"],
		queryFn: () => api.get("/auth/me"),
		retry: false
	});
}
function useProfile() {
	return useQuery({
		queryKey: ["profile"],
		queryFn: () => api.get("/profile")
	});
}
function useUpdateProfile() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body) => api.patch("/profile", body),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] })
	});
}
function useVerificationToken() {
	return useQuery({
		queryKey: ["profile", "verification-token"],
		queryFn: () => api.get("/profile/verification-token")
	});
}
function useLinkAccount() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ platform, handle, verificationToken }) => api.post(`/profile/link/${platform}`, {
			handle,
			verification_token: verificationToken
		}),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] })
	});
}
function useUnlinkAccount() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (platform) => api.delete(`/profile/link/${platform}`),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] })
	});
}
function useUploadResume() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (file) => {
			const form = new FormData();
			form.append("file", file);
			return api.postForm("/profile/resume", form);
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", "resume"] })
	});
}
function useResumeParse() {
	return useQuery({
		queryKey: ["profile", "resume"],
		queryFn: () => api.get("/profile/resume")
	});
}
function useResumeAudit() {
	return useQuery({
		queryKey: [
			"profile",
			"resume",
			"audit"
		],
		queryFn: () => api.get("/profile/resume/audit")
	});
}
function useSkills() {
	return useQuery({
		queryKey: ["skills"],
		queryFn: () => api.get("/skills")
	});
}
function useSkillEvidence(skillId) {
	return useQuery({
		queryKey: [
			"skills",
			skillId,
			"evidence"
		],
		queryFn: () => api.get(`/skills/${skillId}/evidence`),
		enabled: !!skillId
	});
}
function useProjects() {
	return useQuery({
		queryKey: ["projects"],
		queryFn: () => api.get("/projects")
	});
}
function useProject(projectId) {
	return useQuery({
		queryKey: ["projects", projectId],
		queryFn: () => api.get(`/projects/${projectId}`),
		enabled: !!projectId
	});
}
function useTimeline() {
	return useQuery({
		queryKey: ["timeline"],
		queryFn: () => api.get("/timeline")
	});
}
function useRolePredictions() {
	return useQuery({
		queryKey: ["recommendations", "roles"],
		queryFn: () => api.get("/recommendations/roles")
	});
}
function useSkillGap(roleId) {
	return useQuery({
		queryKey: [
			"recommendations",
			"gap",
			roleId
		],
		queryFn: () => api.get(`/recommendations/gap/${roleId}`),
		enabled: !!roleId
	});
}
function useProjectIdeas() {
	return useQuery({
		queryKey: ["recommendations", "projects"],
		queryFn: () => api.get("/recommendations/projects")
	});
}
function useRoadmap(roleId) {
	return useQuery({
		queryKey: ["roadmap", roleId],
		queryFn: () => api.get(`/roadmap/${roleId}`),
		enabled: !!roleId
	});
}
function useSetRoadmapStatus() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ skillId, roleId, status }) => api.patch(`/roadmap/skill/${skillId}/status?role_id=${roleId}&status=${status}`),
		onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["roadmap", vars.roleId] })
	});
}
function usePortfolio() {
	return useQuery({
		queryKey: ["portfolio"],
		queryFn: () => api.get("/portfolio")
	});
}
function useUpdatePortfolio() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body) => api.patch("/portfolio", body),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] })
	});
}
function usePublishPortfolio() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (isPublic) => api.post(`/portfolio/publish?is_public=${isPublic}`),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] })
	});
}
function usePublicPortfolio(handle) {
	return useQuery({
		queryKey: ["public", handle],
		queryFn: () => api.get(`/public/@${handle}`),
		enabled: !!handle,
		retry: false
	});
}
function useGraphSkills() {
	return useQuery({
		queryKey: ["graph", "skills"],
		queryFn: () => api.get("/graph/skills")
	});
}
function useTriggerSync() {
	return useMutation({ mutationFn: () => api.post("/sync/trigger") });
}
function useChatHistory() {
	return useQuery({
		queryKey: ["chat", "history"],
		queryFn: () => api.get("/chat/history")
	});
}
function useSendChatMessage() {
	return useMutation({ mutationFn: (content) => api.post("/chat/message", { content }) });
}
function useClearChatHistory() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => api.delete("/chat/history"),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "history"] })
	});
}
//#endregion
export { useTriggerSync as C, useUploadResume as D, useUpdateProfile as E, useVerificationToken as O, useTimeline as S, useUpdatePortfolio as T, useSendChatMessage as _, useLinkAccount as a, useSkillGap as b, useProject as c, usePublicPortfolio as d, usePublishPortfolio as f, useRolePredictions as g, useRoadmap as h, useGraphSkills as i, useProjectIdeas as l, useResumeParse as m, useClearChatHistory as n, usePortfolio as o, useResumeAudit as p, useCurrentUser as r, useProfile as s, useChatHistory as t, useProjects as u, useSetRoadmapStatus as v, useUnlinkAccount as w, useSkills as x, useSkillEvidence as y };
