//#region src/lib/api.ts
var API_BASE = "http://localhost:8000/api/v1";
var ApiError = class extends Error {
	status;
	constructor(status, message) {
		super(message);
		this.status = status;
	}
};
async function request(path, options = {}) {
	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		credentials: "include",
		headers: {
			...options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {},
			...options.headers
		}
	});
	if (!res.ok) {
		let detail = res.statusText;
		try {
			detail = (await res.json()).detail ?? detail;
		} catch {}
		throw new ApiError(res.status, detail);
	}
	if (res.status === 204) return void 0;
	return await res.json();
}
var api = {
	get: (path) => request(path),
	post: (path, body) => request(path, {
		method: "POST",
		body: body !== void 0 ? JSON.stringify(body) : void 0
	}),
	postForm: (path, form) => request(path, {
		method: "POST",
		body: form
	}),
	patch: (path, body) => request(path, {
		method: "PATCH",
		body: body !== void 0 ? JSON.stringify(body) : void 0
	}),
	delete: (path) => request(path, { method: "DELETE" })
};
function apiOrigin() {
	return API_BASE;
}
function sseUrl(path) {
	return `${API_BASE}${path}`;
}
//#endregion
export { sseUrl as i, api as n, apiOrigin as r, ApiError as t };
