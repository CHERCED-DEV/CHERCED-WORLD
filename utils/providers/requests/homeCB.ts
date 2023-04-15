import { BlogCmsConfig } from "../../../pages/api/blog/blogData/database/blog.interface";
import { CommentsConfig } from "../../../pages/api/blog/comments/database/comments.interface";
import { PostConfig } from "../../../pages/api/blog/posts/database/post.interface";
import { CmsDataConfig } from "../../../pages/api/customCMS/interfaces";
import { ProjectsConfig } from "../../../pages/api/projects/database/interfaces";

//CLIENT CALLS
export async function getCMSData(): Promise<CmsDataConfig> {
  const response = await fetch("/api/customCMS");
  return response.json();
}
export async function getCommentsData(id: string): Promise<CommentsConfig[]> {
  const response = await fetch(`/api/blog/comments/${id}`);
  return response.json();
}

//SERVER CALLS
export async function getBlogCMSData(): Promise<BlogCmsConfig> {
  const response = await fetch(
    process.env.VERCEL_URL_CORS + "/api/blog/blogData"
  );
  return response.json();
}

export async function getPostsData(): Promise<PostConfig[]> {
  const response = await fetch(process.env.VERCEL_URL_CORS + "/api/blog/posts");
  return response.json();
}

export async function getPostByIdData(id: string): Promise<PostConfig> {
  const response = await fetch(
    `${process.env.VERCEL_URL_CORS}/api/blog/posts/${id}`
  );
  return response.json();
}
export async function fetchProject(id: any): Promise<ProjectsConfig> {
  const res = await fetch(`${process.env.VERCEL_URL_CORS}/api/projects/${id}`);
  return res.json();
}
export async function getInBoxData() {
  const res = await fetch(process.env.VERCEL_URL_CORS + "/api/contactMe");
  return res.json();
}
