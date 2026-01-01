import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useMovie, useMovies } from '@/hooks/useMovies';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { MovieRow } from '@/components/MovieRow';
import { Star, Calendar, Clock, Users, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function Movie() {
  const { id } = useParams();
  const { movie, isLoading } = useMovie(id);
  const { movies, incrementViewCount } = useMovies();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { progressSeconds, saveProgress, clearProgress } = useWatchHistory(id);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const isMovieFavorite = id ? isFavorite(id) : false;

  const relatedMovies = movies.filter(m => m.id !== id && m.genre?.some(g => movie?.genre?.includes(g))).slice(0, 10);

  const handleToggleFavorite = () => {
    if (id) {
      toggleFavorite(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 sm:pt-20 container mx-auto px-2 sm:px-4">
          <Skeleton className="w-full aspect-video rounded-lg" />
          <Skeleton className="h-8 sm:h-10 w-3/4 sm:w-1/2 mt-4 sm:mt-6" />
          <Skeleton className="h-16 sm:h-20 w-full mt-3 sm:mt-4" />
        </main>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 sm:pt-20 container mx-auto px-2 sm:px-4 text-center py-16 sm:py-20">
          <h1 className="text-xl sm:text-2xl font-display">Không tìm thấy phim</h1>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header className={`transition-all duration-300 ${isVideoPlaying ? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100'}`} />
      <main className={`transition-all duration-300 ${isVideoPlaying ? 'pt-0' : 'pt-16 sm:pt-20'}`}>
        <div className="container mx-auto px-2 sm:px-4 space-y-4 sm:space-y-8">
          {/* Video Player - Full width on mobile */}
          <div className="w-full -mx-2 sm:mx-0">
            {movie.video_url ? (
              <VideoPlayer 
                src={movie.video_url} 
                poster={movie.poster_url || undefined} 
                title={movie.title} 
                onPlay={() => incrementViewCount(movie.id)}
                onPlayingChange={setIsVideoPlaying}
                savedProgress={progressSeconds}
                onSaveProgress={saveProgress}
                onClearProgress={clearProgress}
              />
            ) : (
              <div className="aspect-video bg-secondary rounded-none sm:rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground text-sm sm:text-base">Video chưa có sẵn</p>
              </div>
            )}
          </div>

          {/* Movie Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 px-2 sm:px-0">
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {/* Title & Favorite Button */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl flex-1">{movie.title}</h1>
                
                {/* Favorite Button */}
                {user ? (
                  <Button
                    onClick={handleToggleFavorite}
                    variant={isMovieFavorite ? "default" : "outline"}
                    className={`gap-2 shrink-0 w-full sm:w-auto ${isMovieFavorite ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
                  >
                    <Heart className={`w-5 h-5 ${isMovieFavorite ? 'fill-current' : ''}`} />
                    {isMovieFavorite ? 'Đã yêu thích' : 'Yêu thích'}
                  </Button>
                ) : (
                  <Link to="/auth" className="w-full sm:w-auto">
                    <Button variant="outline" className="gap-2 w-full">
                      <Heart className="w-5 h-5" />
                      Đăng nhập để yêu thích
                    </Button>
                  </Link>
                )}
              </div>

              {/* Movie Meta */}
              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                {movie.imdb_rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" fill="currentColor" />
                    {movie.imdb_rating}
                  </span>
                )}
                {movie.release_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    {movie.release_year}
                  </span>
                )}
                {movie.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    {movie.duration} phút
                  </span>
                )}
                {movie.view_count && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    {movie.view_count.toLocaleString()} lượt xem
                  </span>
                )}
              </div>

              {/* Genres */}
              {movie.genre && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {movie.genre.map(g => (
                    <span key={g} className="px-2 sm:px-3 py-0.5 sm:py-1 bg-secondary rounded-full text-xs sm:text-sm">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {movie.description && (
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {movie.description}
                </p>
              )}
            </div>

            {/* Side Info */}
            <div className="space-y-3 sm:space-y-4 glass-card p-3 sm:p-4">
              {movie.director && (
                <div>
                  <span className="text-muted-foreground text-xs sm:text-sm">Đạo diễn:</span>
                  <p className="font-medium text-sm sm:text-base">{movie.director}</p>
                </div>
              )}
              {movie.actors && movie.actors.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-xs sm:text-sm">Diễn viên:</span>
                  <p className="font-medium text-sm sm:text-base">{movie.actors.join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Related Movies */}
          {relatedMovies.length > 0 && (
            <div className="px-2 sm:px-0">
              <MovieRow title="Phim liên quan" movies={relatedMovies} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
