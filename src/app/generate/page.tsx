import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import ModernImagen from '@/components/ModernImagen';

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-32">
        <ModernImagen />
      </main>
      <Footer />
    </div>
  );
}
