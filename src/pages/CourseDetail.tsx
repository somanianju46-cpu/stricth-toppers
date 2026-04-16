import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Award, 
  ChevronRight,
  Lock,
  Users,
  Star,
  Smartphone,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseAndStatus = async () => {
      if (!id) return;
      try {
        // Fetch course details
        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Course not found");
          navigate('/');
        }

        // Check enrollment status
        if (user) {
          const enrollmentsRef = collection(db, 'enrollments');
          const q = query(enrollmentsRef, where('userId', '==', user.uid), where('courseId', '==', id));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const enrollmentData = snapshot.docs[0].data();
            setEnrollmentStatus(enrollmentData.status);
            if (enrollmentData.status === 'approved') {
              setIsEnrolled(true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndStatus();
  }, [id, user, navigate]);

  const handleEnroll = () => {
    if (!user) {
      toast.error("Please sign in to enroll");
      return;
    }
    navigate(`/enroll/${id}`);
  };

  if (loading) return <div className="container mx-auto p-20 text-center">Loading...</div>;
  if (!course) return null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Course Header */}
      <section className="bg-slate-950 text-white py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 text-green-500 text-sm font-bold uppercase tracking-wider">
                <Link to="/courses" className="hover:underline">Courses</Link>
                <ChevronRight className="w-4 h-4" />
                <span>{course.category}</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">{course.title}</h1>
              <p className="text-xl text-slate-400 max-w-2xl">
                {course.description}
              </p>
              
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold">4.8</span>
                  <span className="text-slate-500">(2,450 ratings)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>12,450 students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span>English</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold">
                  {course.instructorName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm text-slate-400">Created by</div>
                  <div className="font-bold">{course.instructorName}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-background text-foreground rounded-xl shadow-2xl overflow-hidden sticky top-24 border">
                <div className="aspect-video relative group cursor-pointer">
                  <img 
                    src={course.thumbnail || 'https://picsum.photos/seed/course/800/450'} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-16 h-16 text-white" />
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-600">₹{course.price}</span>
                    <span className="text-muted-foreground line-through">₹199.99</span>
                  </div>
                  
                  {isEnrolled ? (
                    <a 
                      href={`https://wa.me/918660888419?text=Hi, I have enrolled in the course: ${course.title}. Please send me the lesson links.`}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: "secondary" }), "w-full h-12 font-bold bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center gap-2")}
                    >
                      <Smartphone className="w-5 h-5" /> Contact on WhatsApp
                    </a>
                  ) : enrollmentStatus === 'pending' ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center space-y-2">
                      <div className="text-yellow-600 font-bold flex items-center justify-center gap-2">
                        <Clock className="w-5 h-5" /> Verification Pending
                      </div>
                      <p className="text-xs text-muted-foreground">Your payment is under review. Please check back later.</p>
                    </div>
                  ) : (
                    <Button className="w-full h-12 font-bold bg-green-600 hover:bg-green-700 text-white" onClick={handleEnroll}>
                      Enroll Now
                    </Button>
                  )}

                  <div className="space-y-4">
                    <div className="text-sm font-bold">This course includes:</div>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-center gap-3">
                        <PlayCircle className="w-4 h-4" />
                        <span>12 hours on-demand video</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Clock className="w-4 h-4" />
                        <span>Full lifetime access</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Award className="w-4 h-4" />
                        <span>Certificate of completion</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <Tabs defaultValue="curriculum" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-8">
                  <TabsTrigger value="curriculum" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-0 py-4 font-bold">Curriculum</TabsTrigger>
                  <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-0 py-4 font-bold">Description</TabsTrigger>
                  <TabsTrigger value="instructor" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-0 py-4 font-bold">Instructor</TabsTrigger>
                </TabsList>
                
                <TabsContent value="curriculum" className="py-8">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Info className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800 font-medium">
                      Note: These lessons are delivered directly to you on WhatsApp after enrollment approval. This curriculum is for your reference.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {course.lessons?.map((lesson: any, index: number) => (
                      <div key={lesson.id || index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs font-bold border">
                            {index + 1}
                          </div>
                          <span className="font-medium">{lesson.title}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">10:00</span>
                          {isEnrolled ? (
                            <PlayCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="description" className="py-8 prose dark:prose-invert max-w-none">
                  <p>{course.description}</p>
                  <h3>What you'll learn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <span className="text-sm">Comprehensive understanding of the core concepts and advanced techniques.</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="instructor" className="py-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <Avatar className="w-24 h-24 border-2 border-green-500/20">
                      <AvatarFallback className="text-2xl">{course.instructorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold">{course.instructorName}</h3>
                      <p className="text-muted-foreground">
                        Industry expert with over 10 years of experience in the field. 
                        Has taught thousands of students worldwide and is passionate about sharing knowledge.
                      </p>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-bold">4.9 Instructor Rating</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-bold">15,000 Students</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
