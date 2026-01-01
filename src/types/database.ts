export interface Movie {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  video_url: string | null;
  genre: string[] | null;
  release_year: number | null;
  duration: number | null;
  actors: string[] | null;
  director: string | null;
  imdb_rating: number | null;
  view_count: number | null;
  is_featured: boolean | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  movie_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  movie_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const GENRES = [
  'Hành động',
  'Phiêu lưu',
  'Hoạt hình',
  'Hài kịch',
  'Tội phạm',
  'Tài liệu',
  'Chính kịch',
  'Gia đình',
  'Giả tưởng',
  'Lịch sử',
  'Kinh dị',
  'Nhạc kịch',
  'Bí ẩn',
  'Lãng mạn',
  'Khoa học viễn tưởng',
  'Chiến tranh',
  'Phương Tây',
  'Thể thao',
];
