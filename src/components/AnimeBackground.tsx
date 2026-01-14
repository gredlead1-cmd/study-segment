import samuraiBackground from '@/assets/samurai-background.jpg';

export function AnimeBackground() {
  return (
    <>
      {/* Naruto background image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${samuraiBackground})` }}
      />
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 z-0 bg-black/60" />
      {/* Vignette overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
    </>
  );
}
