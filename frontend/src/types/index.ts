export interface Folder {
    id: string;
    name: string;
}

export interface Tag {
    id: string;
    name: string;
    comments?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TagRequest {
    name: string;
    comments?: string;
}

export interface FolderRequest {
    name: string;
}

export type DeleteFolderMode = 'move' | 'delete';

export interface Prompt {
    id: string;
    userId: string;
    folderId?: string;
    title: string;
    currentBody: string;
    isFavorite: boolean;
    comments?: string;
    forkedFromPromptId?: string;
    forkedFromAuthor?: string;
    rowVersion: number;
    createdAt: string;
    updatedAt: string;
    tagIds: string[];
}

export interface PromptFilterParams {
    folderId?: string;
    tagId?: string;
    favorite?: boolean;
}

export interface PromptVersion {
    id: string;
    promptId: string;
    versionNumber: number;
    bodySnapshot: string;
    createdAt: string;
}

export interface PromptRequest {
    title: string;
    currentBody: string;
    isFavorite: boolean;
    folderId?: string;
    tagIds?: string[];
    comments?: string;
}

export interface ShareLink {
    id: string;
    promptId: string;
    token: string;
    expiresAt?: string;
    revokedAt?: string;
    createdAt: string;
    active: boolean;
}

export interface ShareLinkRequest {
    expiresAt?: string | null;
}

export interface PublicShare {
    promptId: string;
    title: string;
    body: string;
    sharedAt: string;
}
