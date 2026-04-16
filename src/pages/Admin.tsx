import * as React from 'react';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, arrayUnion, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  LayoutGrid, 
  Users, 
  DollarSign, 
  BookOpen,
  Trash2,
  Edit,
  Star,
  Check,
  X,
  ExternalLink,
  Clock,
  Image as ImageIcon,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function Admin() {
  const [user] = useAuthState(auth);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    thumbnail: '',
    instructorName: 'Strictch Toppers'
  });

  useEffect(() => {
    // Real-time courses
    const coursesQ = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    const unsubscribeCourses = onSnapshot(coursesQ, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Courses snapshot error:", error);
    });

    // Real-time enrollments
    const enrollmentsQ = query(collection(db, 'enrollments'), orderBy('createdAt', 'desc'));
    const unsubscribeEnrollments = onSnapshot(enrollmentsQ, (snapshot) => {
      setEnrollments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Enrollments snapshot error:", error);
    });

    // Real-time users
    const usersQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(usersQ, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Users snapshot error:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeCourses();
      unsubscribeEnrollments();
      unsubscribeUsers();
    };
  }, []);

  const handleApprove = async (enrollment: any) => {
    try {
      const enrollmentRef = doc(db, 'enrollments', enrollment.id);
      await updateDoc(enrollmentRef, {
        status: 'approved',
        updatedAt: serverTimestamp()
      });

      // Grant course access to user
      const userRef = doc(db, 'users', enrollment.userId);
      await updateDoc(userRef, {
        enrolledCourses: arrayUnion(enrollment.courseId)
      });

      setEnrollments(prev => prev.map(e => e.id === enrollment.id ? { ...e, status: 'approved' } : e));
      toast.success("Enrollment approved and access granted!");
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve enrollment.");
    }
  };

  const handleReject = async (enrollmentId: string) => {
    try {
      const enrollmentRef = doc(db, 'enrollments', enrollmentId);
      await updateDoc(enrollmentRef, {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });

      setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status: 'rejected' } : e));
      toast.success("Enrollment rejected.");
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error("Failed to reject enrollment.");
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsAdding(true);
      const courseData = {
        ...newCourse,
        price: parseFloat(newCourse.price),
        instructorId: user.uid,
        instructorName: newCourse.instructorName || 'Strictch Toppers',
        updatedAt: serverTimestamp(),
      };

      if (editingCourse) {
        await updateDoc(doc(db, 'courses', editingCourse.id), courseData);
        toast.success("Course updated successfully!");
      } else {
        await addDoc(collection(db, 'courses'), {
          ...courseData,
          createdAt: serverTimestamp(),
          lessons: [
            { id: '1', title: 'Introduction', content: 'Welcome to the course!', order: 1 }
          ]
        });
        toast.success("Course added successfully!");
      }

      setEditingCourse(null);
      setNewCourse({
        title: '',
        description: '',
        price: '',
        category: '',
        thumbnail: '',
        instructorName: 'Strictch Toppers'
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      toast.success("Course deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete course.");
    }
  };

  const startEdit = (course: any) => {
    setEditingCourse(course);
    setNewCourse({
      title: course.title,
      description: course.description || '',
      price: course.price.toString(),
      category: course.category || '',
      thumbnail: course.thumbnail || '',
      instructorName: course.instructorName || 'Strictch Toppers'
    });
    setIsDialogOpen(true);
  };

  const totalRevenue = enrollments
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const activeStudents = users.filter(u => u.role !== 'admin').length;

  const avgRating = courses.length > 0 
    ? (courses.reduce((sum, c) => sum + (c.rating || 4.8), 0) / courses.length).toFixed(1)
    : '0.0';

  if (!user) return <div className="container mx-auto p-20 text-center">Please sign in.</div>;

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your courses, students, and revenue.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCourse(null);
            setNewCourse({
              title: '',
              description: '',
              price: '',
              category: '',
              thumbnail: '',
              instructorName: 'Strictch Toppers'
            });
          }
        }}>
          <DialogTrigger
            render={
              <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4" /> Add New Course
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCourse} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course Title</label>
                <Input 
                  required
                  placeholder="e.g. Master React in 30 Days" 
                  value={newCourse.title}
                  onChange={(e: any) => setNewCourse({ ...newCourse, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (₹)</label>
                  <Input 
                    required
                    type="number" 
                    placeholder="49.99" 
                    value={newCourse.price}
                    onChange={(e: any) => setNewCourse({ ...newCourse, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Input 
                    required
                    placeholder="e.g. Development" 
                    value={newCourse.category}
                    onChange={(e: any) => setNewCourse({ ...newCourse, category: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Instructor Name</label>
                <Input 
                  placeholder="e.g. John Doe" 
                  value={newCourse.instructorName}
                  onChange={(e: any) => setNewCourse({ ...newCourse, instructorName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Course Thumbnail URL</label>
                <Input 
                  placeholder="e.g. https://images.unsplash.com/..." 
                  value={newCourse.thumbnail}
                  onChange={(e: any) => setNewCourse({ ...newCourse, thumbnail: e.target.value })}
                />
                {newCourse.thumbnail && (
                  <div className="mt-2 rounded-lg overflow-hidden border aspect-video">
                    <img 
                      src={newCourse.thumbnail} 
                      alt="Thumbnail Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/800/450';
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  required
                  placeholder="What is this course about?" 
                  className="min-h-[100px]"
                  value={newCourse.description}
                  onChange={(e: any) => setNewCourse({ ...newCourse, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isAdding}>
                {isAdding ? "Saving..." : editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate" title={`₹${totalRevenue.toLocaleString()}`}>₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total from approved enrollments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudents}</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">Total published courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating}</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="courses" className="space-y-8">
        <TabsList className="bg-transparent border-b rounded-none h-auto p-0 gap-8">
          <TabsTrigger value="courses" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-0 py-4 font-bold">Courses</TabsTrigger>
          <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-0 py-4 font-bold">
            Users
            {users.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 p-1 flex items-center justify-center rounded-full bg-green-100 text-green-700 border-green-200">
                {users.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="enrollments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-0 py-4 font-bold">
            Enrollments 
            {enrollments.filter(e => e.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1 flex items-center justify-center rounded-full">
                {enrollments.filter(e => e.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Your Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : courses.length > 0 ? (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 font-medium">Course</th>
                        <th className="px-6 py-3 font-medium">Category</th>
                        <th className="px-6 py-3 font-medium">Price</th>
                        <th className="px-6 py-3 font-medium">Students</th>
                        <th className="px-6 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {courses.map(course => (
                        <tr key={course.id} className="bg-background hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                              <img src={course.thumbnail || 'https://picsum.photos/seed/course/100/100'} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <span className="line-clamp-1">{course.title}</span>
                          </td>
                          <td className="px-6 py-4">{course.category}</td>
                          <td className="px-6 py-4 font-bold text-green-600">₹{course.price}</td>
                          <td className="px-6 py-4">{enrollments.filter(e => e.courseId === course.id && e.status === 'approved').length}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:text-green-600"
                                onClick={() => startEdit(course)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteCourse(course.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No courses created yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Platform Users</CardTitle>
              <CardDescription>All registered students and administrators.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : users.length > 0 ? (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 font-medium">User</th>
                        <th className="px-6 py-3 font-medium">Role</th>
                        <th className="px-6 py-3 font-medium">Phone</th>
                        <th className="px-6 py-3 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map(u => (
                        <tr key={u.id} className="bg-background hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                                {u.displayName?.charAt(0) || u.email?.charAt(0) || '?'}
                              </div>
                              <div>
                                <div className="font-medium truncate max-w-[150px]">{u.displayName || 'Anonymous'}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={cn(
                              u.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
                            )}>
                              {u.role || 'student'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs">{u.phone || 'N/A'}</td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Recently'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No users found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Requests</CardTitle>
              <CardDescription>Review manual payment submissions and grant course access.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : enrollments.length > 0 ? (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 font-medium">Student</th>
                        <th className="px-6 py-3 font-medium">Course</th>
                        <th className="px-6 py-3 font-medium">Transaction ID</th>
                        <th className="px-6 py-3 font-medium">Proof</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {enrollments.map(enrollment => (
                        <tr key={enrollment.id} className="bg-background hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium truncate max-w-[150px]">{enrollment.userName}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">{enrollment.userEmail}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">{enrollment.userPhone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium truncate max-w-[150px]">{enrollment.courseTitle}</div>
                            <div className="text-xs font-bold text-green-600">₹{enrollment.amount}</div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">
                            {enrollment.transactionId}
                          </td>
                          <td className="px-6 py-4">
                            {enrollment.proofUrl ? (
                              <div className="flex flex-col gap-2">
                                <div className="w-16 h-16 rounded-lg border overflow-hidden bg-muted shadow-sm">
                                  <img 
                                    src={enrollment.proofUrl} 
                                    alt="Proof" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-[10px] px-2 font-bold border-green-200 text-green-700 hover:bg-green-50"
                                  onClick={() => {
                                    const win = window.open();
                                    if (win) {
                                      win.document.write(`
                                        <html>
                                          <head><title>Payment Proof</title></head>
                                          <body style="margin:0; display:flex; align-items:center; justify-content:center; background:#f4f4f5;">
                                            <img src="${enrollment.proofUrl}" style="max-width:100%; max-height:100vh; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);" />
                                          </body>
                                        </html>
                                      `);
                                      win.document.close();
                                    }
                                  }}
                                >
                                  View Full Proof
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No Proof Uploaded</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge 
                              className={cn(
                                enrollment.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                enrollment.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                enrollment.status === 'pending_payment' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              )}
                              variant="outline"
                            >
                              {enrollment.status === 'pending_payment' ? 'Awaiting Payment' : enrollment.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {enrollment.status === 'pending' ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleApprove(enrollment)}
                                  >
                                    <Check className="w-4 h-4 mr-1" /> Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="h-8"
                                    onClick={() => handleReject(enrollment.id)}
                                  >
                                    <X className="w-4 h-4 mr-1" /> Reject
                                  </Button>
                                </div>
                                <a 
                                  href={`https://wa.me/${enrollment.userPhone?.replace(/\D/g, '')}?text=Hi ${enrollment.userName}, I have received your payment for ${enrollment.courseTitle}. Here is your course link: `}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-xs border-green-200 text-green-700 hover:bg-green-50 gap-1")}
                                >
                                  <Smartphone className="w-3 h-3" /> Message on WhatsApp
                                </a>
                              </div>
                            ) : enrollment.status === 'pending_payment' ? (
                              <span className="text-xs text-muted-foreground italic">User is on payment step...</span>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <span className="text-xs text-muted-foreground">Processed</span>
                                <a 
                                  href={`https://wa.me/${enrollment.userPhone?.replace(/\D/g, '')}?text=Hi ${enrollment.userName}, here is your course link for ${enrollment.courseTitle}: `}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-xs border-green-200 text-green-700 hover:bg-green-50 gap-1")}
                                >
                                  <Smartphone className="w-3 h-3" /> Resend Link
                                </a>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No enrollments found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
