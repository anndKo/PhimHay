import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Upload, Film, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useMovies } from '@/hooks/useMovies';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GENRES } from '@/types/database';
import { Progress } from '@/components/ui/progress';
import * as tus from 'tus-js-client';

export default function Admin() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { movies, addMovie, updateMovie, deleteMovie, fetchMovies } = useMovies();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', genre: [] as string[], release_year: '', duration: '', actors: '', director: '', imdb_rating: '', is_featured: false, display_order: '0', poster_url: '', video_url: '' });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/');
  }, [user, isAdmin, authLoading, navigate]);

  const [uploadType, setUploadType] = useState<'poster' | 'video' | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [totalFileSize, setTotalFileSize] = useState(0);
  const uploadRef = useRef<tus.Upload | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const cancelUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }
    setUploading(false);
    setUploadType(null);
    setUploadProgress(0);
    toast({ title: 'Đã hủy upload' });
  };

  const uploadFileWithProgress = async (file: File, bucket: string, type: 'poster' | 'video'): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    
    setUploading(true);
    setUploadProgress(0);
    setUploadType(type);
    setTotalFileSize(file.size);
    setUploadedFileSize(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Bạn cần đăng nhập để upload file');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      // Use TUS for large files (> 6MB), regular upload for smaller files
      const useTus = file.size > 6 * 1024 * 1024;
      
      if (useTus) {
        return new Promise((resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: {
              authorization: `Bearer ${session.access_token}`,
              apikey: supabaseKey,
            },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            metadata: {
              bucketName: bucket,
              objectName: fileName,
              contentType: file.type || 'application/octet-stream',
              cacheControl: '3600',
            },
            chunkSize: 6 * 1024 * 1024, // 6MB chunks
            onError: (error) => {
              setUploading(false);
              setUploadType(null);
              uploadRef.current = null;
              reject(new Error(error.message || 'Upload thất bại'));
            },
            onProgress: (bytesUploaded, bytesTotal) => {
              const percent = Math.round((bytesUploaded / bytesTotal) * 100);
              setUploadProgress(percent);
              setUploadedFileSize(bytesUploaded);
            },
            onSuccess: () => {
              setUploading(false);
              setUploadType(null);
              uploadRef.current = null;
              const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;
              resolve(publicUrl);
            },
          });

          uploadRef.current = upload;
          
          // Check for previous uploads
          upload.findPreviousUploads().then((previousUploads) => {
            if (previousUploads.length) {
              upload.resumeFromPreviousUpload(previousUploads[0]);
            }
            upload.start();
          });
        });
      } else {
        // Regular upload for small files
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const url = `${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`;
          
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percent);
              setUploadedFileSize(event.loaded);
            }
          });

          xhr.addEventListener('load', () => {
            setUploading(false);
            setUploadType(null);
            if (xhr.status >= 200 && xhr.status < 300) {
              const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;
              resolve(publicUrl);
            } else {
              let errorMsg = 'Upload thất bại';
              try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || response.error || errorMsg;
              } catch {}
              reject(new Error(errorMsg));
            }
          });

          xhr.addEventListener('error', () => {
            setUploading(false);
            setUploadType(null);
            reject(new Error('Lỗi kết nối mạng'));
          });

          xhr.open('POST', url);
          xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
          xhr.setRequestHeader('apikey', supabaseKey);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.setRequestHeader('x-upsert', 'true');
          xhr.send(file);
        });
      }
    } catch (error: any) {
      setUploading(false);
      setUploadType(null);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const movieData = {
      title: form.title,
      description: form.description || null,
      genre: form.genre.length > 0 ? form.genre : null,
      release_year: form.release_year ? parseInt(form.release_year) : null,
      duration: form.duration ? parseInt(form.duration) : null,
      actors: form.actors ? form.actors.split(',').map(a => a.trim()) : null,
      director: form.director || null,
      imdb_rating: form.imdb_rating ? parseFloat(form.imdb_rating) : null,
      is_featured: form.is_featured,
      display_order: form.is_featured ? parseInt(form.display_order) || 0 : 0,
      poster_url: form.poster_url || null,
      video_url: form.video_url || null,
      created_by: user?.id,
    };

    if (editingMovie) {
      await updateMovie(editingMovie.id, movieData);
    } else {
      await addMovie(movieData);
    }
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setForm({ title: '', description: '', genre: [], release_year: '', duration: '', actors: '', director: '', imdb_rating: '', is_featured: false, display_order: '0', poster_url: '', video_url: '' });
    setEditingMovie(null);
  };

  const handleEdit = (movie: any) => {
    setEditingMovie(movie);
    setForm({
      title: movie.title,
      description: movie.description || '',
      genre: movie.genre || [],
      release_year: movie.release_year?.toString() || '',
      duration: movie.duration?.toString() || '',
      actors: movie.actors?.join(', ') || '',
      director: movie.director || '',
      imdb_rating: movie.imdb_rating?.toString() || '',
      is_featured: movie.is_featured || false,
      display_order: movie.display_order?.toString() || '0',
      poster_url: movie.poster_url || '',
      video_url: movie.video_url || '',
    });
    setIsDialogOpen(true);
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFileWithProgress(file, 'posters', 'poster');
      setForm(prev => ({ ...prev, poster_url: url }));
      toast({ title: 'Upload poster thành công' });
    } catch (error: any) {
      toast({ title: 'Lỗi upload poster', description: error.message, variant: 'destructive' });
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxSize = 3 * 1024 * 1024 * 1024; // 3GB
    if (file.size > maxSize) {
      toast({ title: 'File quá lớn', description: 'Video không được vượt quá 3GB', variant: 'destructive' });
      return;
    }
    
    try {
      const url = await uploadFileWithProgress(file, 'videos', 'video');
      setForm(prev => ({ ...prev, video_url: url }));
      toast({ title: 'Upload video thành công' });
    } catch (error: any) {
      if (error.message !== 'Upload đã bị hủy') {
        toast({ title: 'Lỗi upload video', description: error.message, variant: 'destructive' });
      }
    }
  };

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-5 h-5" /></Button>
            <h1 className="font-display text-3xl">Quản lý phim</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild><Button className="btn-primary gap-2"><Plus className="w-4 h-4" />Thêm phim</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingMovie ? 'Sửa phim' : 'Thêm phim mới'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Tiêu đề *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
                  <div className="space-y-2"><Label>Năm phát hành</Label><Input type="number" value={form.release_year} onChange={e => setForm(p => ({ ...p, release_year: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>Mô tả</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Thời lượng (phút)</Label><Input type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Điểm IMDb</Label><Input type="number" step="0.1" max="10" value={form.imdb_rating} onChange={e => setForm(p => ({ ...p, imdb_rating: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Đạo diễn</Label><Input value={form.director} onChange={e => setForm(p => ({ ...p, director: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>Diễn viên (cách nhau dấu phẩy)</Label><Input value={form.actors} onChange={e => setForm(p => ({ ...p, actors: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Thể loại</Label><div className="flex flex-wrap gap-2">{GENRES.map(g => (<button key={g} type="button" onClick={() => setForm(p => ({ ...p, genre: p.genre.includes(g) ? p.genre.filter(x => x !== g) : [...p.genre, g] }))} className={`px-3 py-1 rounded-full text-sm transition ${form.genre.includes(g) ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>{g}</button>))}</div></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Poster</Label>
                    <Input type="file" accept="image/*" onChange={handlePosterUpload} disabled={uploading} />
                    {uploading && uploadType === 'poster' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Đang tải poster...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                    {form.poster_url && <img src={form.poster_url} className="w-20 h-30 object-cover rounded" />}
                  </div>
                  <div className="space-y-2">
                    <Label>Video (tối đa 3GB)</Label>
                    <Input type="file" accept="video/*" onChange={handleVideoUpload} disabled={uploading} />
                    {uploading && uploadType === 'video' && (
                      <div className="space-y-3 p-4 rounded-lg bg-secondary/50 border border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-foreground font-medium">Đang tải video...</span>
                          <Button variant="ghost" size="sm" onClick={cancelUpload} className="h-7 px-2 text-destructive hover:text-destructive">
                            <X className="w-4 h-4 mr-1" />
                            Hủy
                          </Button>
                        </div>
                        <Progress value={uploadProgress} className="h-3" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatFileSize(uploadedFileSize)} / {formatFileSize(totalFileSize)}</span>
                          <span className="text-primary font-bold">{uploadProgress}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {totalFileSize > 6 * 1024 * 1024 
                            ? '📦 Upload theo từng phần - có thể tiếp tục nếu bị gián đoạn' 
                            : '⚡ Upload nhanh'}
                        </p>
                      </div>
                    )}
                    {form.video_url && !uploading && (
                      <div className="flex items-center gap-2 text-xs text-green-500">
                        <Film className="w-4 h-4" />
                        <span>Video đã tải lên thành công</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="rounded" />
                    <span>Phim nổi bật</span>
                  </label>
                  {form.is_featured && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Thứ tự hiển thị:</Label>
                      <Input 
                        type="number" 
                        value={form.display_order} 
                        onChange={e => setForm(p => ({ ...p, display_order: e.target.value }))} 
                        className="w-20 h-8"
                        min="1"
                        placeholder="1"
                      />
                      <span className="text-xs text-muted-foreground">(số nhỏ hơn = hiển thị trước)</span>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full btn-primary">{editingMovie ? 'Cập nhật' : 'Thêm phim'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {movies.map(movie => (
            <div key={movie.id} className="glass-card p-4 flex items-center gap-4">
              {movie.poster_url ? <img src={movie.poster_url} className="w-16 h-24 object-cover rounded" /> : <div className="w-16 h-24 bg-secondary rounded flex items-center justify-center"><Film className="w-6 h-6 text-muted-foreground" /></div>}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{movie.title}</h3>
                <p className="text-sm text-muted-foreground">{movie.release_year} • {movie.genre?.slice(0, 2).join(', ')}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handleEdit(movie)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="destructive" size="icon" onClick={() => deleteMovie(movie.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
          {movies.length === 0 && <div className="text-center py-12 text-muted-foreground">Chưa có phim nào. Hãy thêm phim mới!</div>}
        </div>
      </div>
    </div>
  );
}
