import { CmsDataConfig } from '../../../pages/api/customCMS/interfaces'
import { ProjectsConfig } from '../../../pages/api/projects/database/interfaces'

export async function getCMSData(): Promise<CmsDataConfig> {
    const response = await fetch(`https://${process.env.VERCEL_URL}/api/customCMS`);
    return response.json();
} 

export async function fetchProject(id: any): Promise<ProjectsConfig> {
    const res = await fetch(`https://${process.env.VERCEL_URL}/api/projects/${id}`);
    return res.json();
}
