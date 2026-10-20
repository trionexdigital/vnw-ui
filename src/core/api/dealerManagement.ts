import { httpService } from '../services/http';
import { BASE_URL } from './baseURL';
export interface ModuleAccess {
  enabled: boolean;
  permissions: string[];
  statement: boolean;
  admin?: boolean;
}
export interface ModulePage {
  items: any[];
  total: number;
  page: number;
  limit: number;
  summary?: Record<string, string>;
}
export async function dm<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const result = await httpService.postRequest(BASE_URL + '/dealer-management/' + action, payload);
  if (result?.status !== 1) throw new Error(result?.info || 'Dealer management request failed.');
  return result.data as T;
}
export const requestKey = () => crypto.randomUUID();
export const mutation = (action: string, payload: Record<string, unknown>, key: string = requestKey()) => dm(action, {
  ...payload,
  request_key: key
});
export async function allModuleDealers() {
  const rows: any[] = [];
  let page = 1;
  while (true) {
    const result = await dm<ModulePage>('dealers', {
      page,
      limit: 100
    });
    rows.push(...result.items);
    if (rows.length >= result.total || !result.items.length) return rows;
    page++;
  }
}
export function downloadWorkbook(result: {
  filename: string;
  content_base64: string;
}) {
  const bytes = Uint8Array.from(atob(result.content_base64), c => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }));
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function fileBase64(file: File): Promise<string> {
  if (file.size > 5_000_000) throw new Error('Choose a file smaller than 5 MB.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(file);
  });
}
