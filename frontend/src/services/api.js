import axios from "axios";
import { local } from "../utils/store";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL: API_URL, timeout: 30000 });

// A message a person can act on, whatever went wrong (server message, cold start, offline).
export function apiError(err, fallback = "Something went wrong. Please try again.") {
  const msg = err?.response?.data?.message;
  if (msg) return msg;
  if (!err?.response) return "Can't reach the server. It may be waking up, so try again in a few seconds.";
  return fallback;
}

api.interceptors.request.use((config) => {
  const token = local.get("rumion_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Auth ----
export const registerUser = (payload) => api.post("/auth/register", payload).then((r) => r.data);
export const loginUser = (payload) => api.post("/auth/login", payload).then((r) => r.data);
export const fetchMe = () => api.get("/auth/me").then((r) => r.data);
export const updateMe = (formData) =>
  api.patch("/auth/me", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
export const toggleFavorite = (novelId) => api.put(`/auth/favorites/${novelId}`).then((r) => r.data);

// ---- Novels (original, platform-hosted) ----
export const fetchNovels = (params) => api.get("/novels", { params }).then((r) => r.data);
export const fetchTrending = () => api.get("/novels/trending").then((r) => r.data);
export const fetchNovel = (id) => api.get(`/novels/${id}`).then((r) => r.data);
export const fetchMyNovels = () => api.get("/novels/mine/list").then((r) => r.data);
export const createNovel = (formData) =>
  api.post("/novels", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
export const updateNovel = (id, formData) =>
  api.patch(`/novels/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
export const deleteNovel = (id) => api.delete(`/novels/${id}`).then((r) => r.data);

// ---- Chapters ----
export const fetchChapterList = (novelId) => api.get(`/chapters/novel/${novelId}`).then((r) => r.data);
export const fetchChapter = (id) => api.get(`/chapters/${id}`).then((r) => r.data);
export const createChapter = (payload) => api.post("/chapters", payload).then((r) => r.data);
export const updateChapter = (id, payload) => api.patch(`/chapters/${id}`, payload).then((r) => r.data);
export const deleteChapter = (id) => api.delete(`/chapters/${id}`).then((r) => r.data);

// ---- Comments ----
export const fetchComments = (novelId, params) => api.get(`/comments/novel/${novelId}`, { params }).then((r) => r.data);
export const postComment = (payload) => api.post("/comments", payload).then((r) => r.data);
export const deleteComment = (id) => api.delete(`/comments/${id}`).then((r) => r.data);

// ---- Ratings ----
export const rateNovel = (novelId, score) => api.put(`/ratings/${novelId}`, { score }).then((r) => r.data);
export const fetchMyRating = (novelId) => api.get(`/ratings/${novelId}/mine`).then((r) => r.data);

// ---- Catalog (Nabees Novel API, proxied by our backend) ----
export const searchExternal = (q, p = 1, l = 20) => api.get("/external/search", { params: { q, p, l } }).then((r) => r.data);
export const fetchExternalGenre = (id, p = 1, l = 20) => api.get(`/external/genre/${id}`, { params: { p, l } }).then((r) => r.data);
export const fetchExternalFeatured = (p = 1, l = 20) => api.get("/external/featured", { params: { p, l } }).then((r) => r.data);
export const fetchExternalRankings = (rank = 1, p = 1, l = 20) => api.get("/external/rankings", { params: { rank, p, l } }).then((r) => r.data);
export const fetchExternalNovel = (detailPath) => api.get(`/external/novel/${encodeURIComponent(detailPath)}`).then((r) => r.data);
export const fetchExternalChapters = (novelId, order = "ASC") => api.get("/external/chapters", { params: { id: novelId, order, l: 1000 } }).then((r) => r.data);
export const fetchExternalChapter = (id) => api.get(`/external/chapter/${id}`).then((r) => r.data);
export const fetchMirrorByExternal = (externalId) => api.get(`/novels/by-external/${encodeURIComponent(externalId)}`).then((r) => r.data);
export const mirrorExternalNovel = (payload) => api.post("/novels/external-mirror", payload).then((r) => r.data);
