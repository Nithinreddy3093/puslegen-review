
import { User, UserRole } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@visiguard.ai',
    orgId: 'org1',
    role: UserRole.ADMIN,
    avatar: 'https://picsum.photos/seed/admin/100/100'
  },
  {
    id: 'u2',
    name: 'Content Editor',
    email: 'editor@visiguard.ai',
    orgId: 'org1',
    role: UserRole.EDITOR,
    avatar: 'https://picsum.photos/seed/editor/100/100'
  },
  {
    id: 'u3',
    name: 'Regular Viewer',
    email: 'viewer@visiguard.ai',
    orgId: 'org1',
    role: UserRole.VIEWER,
    avatar: 'https://picsum.photos/seed/viewer/100/100'
  }
];

export const STORAGE_KEYS = {
  VIDEOS_METADATA: 'vg_videos_metadata',
  AUTH_USER: 'vg_auth_user',
};

export const DB_NAME = 'VisiGuardDB';
export const VIDEO_STORE = 'videos_blobs';
