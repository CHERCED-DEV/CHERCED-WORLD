export const PROJECT_MEDIA_PREFIX = 'project-media-'

export function projectMediaName(id: string): string {
  return `${PROJECT_MEDIA_PREFIX}${id.replace(/[^A-Za-z0-9_-]/g, '-')}`
}
