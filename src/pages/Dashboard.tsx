import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { CourseCard } from '@/components/CourseCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, Award, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user) return;
      try {
        // Fetch enrollments to get status and course IDs
        const enrollmentsRef = collection(db, 'enrollments');
        const qEnroll = query(enrollmentsRef, where('userId', '==', user.uid));
        const enrollSnap = await getDocs(qEnroll);
        
        const enrollmentsMap = new Map();
        const courseIds: string[] = [];
        
        enrollSnap.docs.forEach(doc => {
          const data = doc.data();
          enrollmentsMap.set(data.courseId, data.status);
          courseIds.push(data.courseId);
        });
        
        if (courseIds.length > 0) {
          const coursesRef = collection(db, 'courses');
          const qCourses = query(coursesRef, where('__name__', 'in', courseIds.slice(0, 10)));
          const coursesSnap = await getDocs(qCourses);
          
          const coursesData = coursesSnap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            enrollmentStatus: enrollmentsMap.get(doc.id)
          }));
          setEnrolledCourses(coursesData);
        }
      } catch (error) {
        console.error("Error fetching enrolled courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [user]);

  if (!user) return <div className="container mx-auto p-20 text-center">Please sign in to view your dashboard.</div>;

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.displayName}!</h1>
          <p className="text-muted-foreground mt-1">Track your progress and continue learning.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-4 border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{enrolledCourses.length}</div>
              <div className="text-xs text-muted-foreground">Enrolled Courses</div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-4 border">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs text-muted-foreground">Certificates</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-courses" className="space-y-8">
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0 gap-8">
          <TabsTrigger value="my-courses" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 font-bold">My Courses</TabsTrigger>
          <TabsTrigger value="certificates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 font-bold">Certificates</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-4 font-bold">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="my-courses">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-video rounded-xl" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {enrolledCourses.map(course => (
                <CourseCard key={course.id} course={course} status={course.enrollmentStatus} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-bold">No courses yet</h3>
              <p className="text-muted-foreground mt-2">Explore our catalog and start learning today!</p>
              <Link 
                to="/" 
                className={cn(buttonVariants(), "mt-6")}
              >
                Browse Courses
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="certificates">
          <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold">No certificates yet</h3>
            <p className="text-muted-foreground mt-2">Complete a course to earn your first certificate.</p>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display Name</label>
                  <Input defaultValue={user.displayName || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input defaultValue={user.email || ''} disabled />
                </div>
              </div>
              <Button>Save Changes</Button>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back. Please be certain.</p>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
