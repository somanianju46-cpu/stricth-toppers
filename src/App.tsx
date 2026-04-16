import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import Home from '@/pages/Home';
import CourseDetail from '@/pages/CourseDetail';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import Learn from '@/pages/Learn';
import Enroll from '@/pages/Enroll';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import { Toaster } from '@/components/ui/sonner';
import { ChevronUp } from 'lucide-react';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 hidden lg:block"
    >
      <ChevronUp className="w-6 h-6" />
    </button>
  );
}

function AuthSync() {
  const [user] = useAuthState(auth);

  useEffect(() => {
    const syncUser = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // Create user profile on first login
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: user.email === 'somanianju46@gmail.com' ? 'admin' : 'student',
            enrolledCourses: [],
            createdAt: serverTimestamp()
          });
        } else {
          // Ensure admin role is set for the specific admin email
          const userData = userSnap.data();
          if (user.email === 'somanianju46@gmail.com' && userData.role !== 'admin') {
            await updateDoc(userRef, { role: 'admin' });
          }
        }
      }
    };

    syncUser();
  }, [user]);

  return null;
}

function ConnectionTest() {
  useEffect(() => {
    async function testConnection() {
      try {
        // Test connection to Firestore
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    }
    testConnection();
  }, []);

  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <ConnectionTest />
      <div className="min-h-screen bg-background font-sans antialiased">
        <AuthSync />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/learn/:id" element={<Learn />} />
            <Route path="/enroll/:id" element={<Enroll />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/courses" element={<Home />} /> {/* For now, reuse Home for browsing */}
          </Routes>
        </main>
        <Toaster position="top-center" />
        <ScrollToTopButton />
        
        <footer className="border-t py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="space-y-4">
                <div className="font-bold text-xl">Strictch Toppers</div>
                <p className="text-sm text-muted-foreground">
                  Master the art of tailoring with Anju Somani. Professional stitching and design courses for everyone.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to="/" className="hover:text-green-600 transition-colors">Browse Courses</Link></li>
                  <li><Link to="/dashboard" className="hover:text-green-600 transition-colors">My Learning</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="/#features" className="hover:text-green-600 transition-colors">About Anju</a></li>
                  <li><a href="/#featured-courses" className="hover:text-green-600 transition-colors">Tailoring Courses</a></li>
                  <li><a href="https://wa.me/918660888419" target="_blank" rel="noreferrer" className="hover:text-green-600 transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to="/privacy" className="hover:text-green-600 transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/privacy" className="hover:text-green-600 transition-colors">Terms of Service</Link></li>
                  <li><Link to="/privacy" className="hover:text-green-600 transition-colors">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Strictch Toppers. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
