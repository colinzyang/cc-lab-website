import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Breadcrumb } from './components/Breadcrumb';
import { BreadcrumbProvider, useBreadcrumb } from './src/context/BreadcrumbContext';
import { Home } from './components/Home';
import { Member } from './components/Member';
import { Research } from './components/Research';
import { Publication } from './components/Publication';
// import { Resources } from './components/Resources'; // TODO: 暂时隐藏，待内容完善后恢复
import { News } from './components/News';
import { Contact } from './components/Contact';
import { preloadAllData } from './src/lib/dataLoader';

// ScrollToTop component to reset scroll position on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Toggles the page texture on #app-shell based on the current route:
//   "/"                                     → home-texture (full-page grid)
//   /member, /research, /publication, /news → top-texture (top band only)
//   anywhere else (e.g. /contact)           → none
// See the #app-shell.home-texture / .top-texture rules in src/index.css.
const TOP_TEXTURE_PATHS = ['/member', '/research', '/publication', '/news'];
const ShellTexture: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    const shell = document.getElementById('app-shell');
    if (!shell) return;
    shell.classList.toggle('home-texture', pathname === '/');
    shell.classList.toggle('top-texture', TOP_TEXTURE_PATHS.includes(pathname));
  }, [pathname]);

  return null;
};

// Main content wrapper with conditional breadcrumb
const MainContent = () => {
  const { items } = useBreadcrumb();

  return (
    <main className="flex-grow flex flex-col w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 py-8 lg:py-12">
      {/* Breadcrumb Container - 只在有内容时显示 */}
      {items.length > 0 && (
        <div className="mb-8">
          <Breadcrumb />
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/member" element={<Member />} />
        <Route path="/research" element={<Research />} />
        <Route path="/publication" element={<Publication />} />
        {/* <Route path="/resources" element={<Resources />} /> */}
        <Route path="/news" element={<News />} />
        <Route path="/contact" element={<Contact />} />
        {/* Catch-all route redirects to home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </main>
  );
};

const App: React.FC = () => {
  React.useEffect(() => {
    preloadAllData();
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <BreadcrumbProvider>
        <ScrollToTop />
        <ShellTexture />
        <div
          id="app-shell"
          className="flex flex-col min-h-screen font-sans bg-background-light dark:bg-background-dark relative isolate"
        >
          <Navbar />
          <MainContent />
          <Footer />
        </div>
      </BreadcrumbProvider>
    </Router>
  );
};

export default App;