import { HomeData } from '../../pages/api/customCMS/INTERFACES'

export async function getHomeData(): Promise<HomeData> {
    const response = await fetch('/api/homeCMS');
    return response.json();
} 