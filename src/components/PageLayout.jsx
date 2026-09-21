import Navbar from './Navbar';
import Footer from './Footer';
import './PageLayout.css';

export default function PageLayout({ children }) {
  return (
    <div className="page-layout">
      <Navbar />
      <main className="page-layout__main">
        {children}
      </main>
      <Footer />
    </div>
  );
}
