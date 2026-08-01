export interface Document {
  id: string;
  caseId: string;
  orgId: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface DocumentListResponse {
  data: Document[];
  total: number;
  page: number;
  limit: number;
}

export interface DocumentFolder {
  caseId: string;
  title: string;
  documentCount: number;
}

