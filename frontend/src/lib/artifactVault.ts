const artifactPreviewKey = (artifactId: string): string => `top-artifact-preview:${artifactId}`;

export function saveLocalArtifactPreview(artifactId: string, dataUrl: string): boolean {
  try {
    localStorage.setItem(artifactPreviewKey(artifactId), dataUrl);
    return true;
  } catch {
    return false;
  }
}

export function getLocalArtifactPreview(artifactId: string): string | null {
  try {
    const value = localStorage.getItem(artifactPreviewKey(artifactId));
    return value?.startsWith("data:image/") ? value : null;
  } catch {
    return null;
  }
}
