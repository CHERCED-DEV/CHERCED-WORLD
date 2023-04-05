import { BlogCmsConfig } from '../../../pages/api/blog/blogData/database/blog.interface';
import { CmsDataConfig } from '../../../pages/api/customCMS/interfaces'
import { ProjectsConfig } from '../../../pages/api/projects/database/interfaces'


export async function getCMSData(): Promise<CmsDataConfig> {
    const response = await fetch('/api/customCMS');
    return response.json();
}

export async function getBlogCMSData(): Promise<BlogCmsConfig> {
    const response = await fetch(process.env.VERCEL_URL_CORS+'/api/blog/blogData');
    return response.json();
} 

export async function fetchProject(id: any): Promise<ProjectsConfig> {
    const res = await fetch(`api/projects/${id}`);
    return res.json();
}
