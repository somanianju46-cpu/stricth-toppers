import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  PlayCircle, 
  CheckCircle2, 
  Menu,
  BookOpen,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export default function Learn() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, loadingAuth] = useAuthState(auth);
  const [course, setCourse] = useState<any>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const fetchCourseAndAccess = async () => {
      if (!id || !user) return;
      try {
        // Fetch course
        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Course not found");
          navigate('/dashboard');
          return;
        }

        // Check Admin status
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        
        if (userData?.role === 'admin') {
          setIsApproved(true);
          return;
        }

        // Check Enrollment status
        const enrollmentsRef = collection(db, 'enrollments');
        const q = query(enrollmentsRef, where('userId', '==', user.uid), where('courseId', '==', id), where('status', '==', 'approved'));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          setIsApproved(true);
        } else {
          toast.error("Access denied. Enrollment not approved.");
          navigate(`/course/${id}`);
        }
      } catch (error) {
        console.error("Error checking access:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!loadingAuth && user) {
      fetchCourseAndAccess();
    } else if (!loadingAuth && !user) {
      setLoading(false);
    }
  }, [id, user, loadingAuth, navigate]);

  if (loading || loadingAuth) return <div className="container mx-auto p-20 text-center">Loading...</div>;
  if (!course || !isApproved) return null;

  const currentLesson = course.lessons?.[currentLessonIndex];

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center">
      <div className="w-20 h-20 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mb-8">
        <Smartphone className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Lessons are on WhatsApp</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Thank you for enrolling in <span className="font-bold text-foreground">{course.title}</span>. 
        As per our policy, all course materials and lesson links are sent directly to your WhatsApp.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <a 
          href={`https://wa.me/918660888419?text=Hi, I am enrolled in ${course.title}. Please send me the lessons.`}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "bg-green-600 hover:bg-green-700 text-white font-bold gap-2")}
        >
          <Smartphone className="w-5 h-5" /> Open WhatsApp
        </a>
        <Button variant="outline" size="lg" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
