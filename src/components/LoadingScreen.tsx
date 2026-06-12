export default function LoadingScreen() {
  return (
    <section
      className="min-h-screen w-full bg-black flex items-center justify-center"
      aria-label="Carregando"
    >
      <div className="circle-loader" aria-hidden="true" />
    </section>
  );
}
