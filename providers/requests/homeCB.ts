import { CmsDataConfig } from '../../pages/api/customCMS/interfaces'

export async function getCMSData(): Promise<CmsDataConfig> {
    const response = await fetch('/api/homeCMS');
    return response.json();
} 