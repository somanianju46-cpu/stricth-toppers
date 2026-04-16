import { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CourseCard } from '@/components/CourseCard';
import { Search, ArrowRight, Sparkles, Shield, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToCourses = () => {
    const element = document.getElementById('featured-courses');
    element?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), limit(6));
        const snapshot = await getDocs(q);
        const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/education/1920/1080')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950 to-slate-950" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30 px-4 py-1">
                New: AI-Powered Learning Paths
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
                Master New Skills with <span className="text-green-500">Strictch Toppers</span>
              </h1>
              <p className="text-xl text-slate-400 mt-6 max-w-2xl mx-auto">
                Learn the art of professional tailoring from Anju Somani. 
                Master stitching, cutting, and design with expert-led courses.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="What do you want to learn?" 
                  className="pl-10 h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                size="lg" 
                className="h-12 px-8 font-bold bg-green-600 hover:bg-green-700 text-white"
                onClick={scrollToCourses}
              >
                Explore Courses
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Expert Mentors</h3>
              <p className="text-muted-foreground">Learn from professionals with years of experience in their respective fields.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Safe Environment</h3>
              <p className="text-muted-foreground">Learn in a supportive and safe environment tailored for your professional growth and comfort.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Scissors className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Tailoring Mastery</h3>
              <p className="text-muted-foreground">Learn advanced stitching techniques and modern garment design from scratch.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section id="featured-courses" className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Featured Courses</h2>
              <p className="text-muted-foreground mt-2">Hand-picked courses to get you started on your journey.</p>
            </div>
            <Button variant="ghost" className="hidden sm:flex items-center gap-2">
              View all courses <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <div className="aspect-video bg-muted animate-pulse rounded-lg" />
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:overflow-x-auto lg:pb-8 lg:gap-8 lg:snap-x lg:snap-mandatory no-scrollbar">
              {filteredCourses.map(course => (
                <div key={course.id} className="lg:min-w-[400px] lg:snap-start">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-background rounded-2xl border-2 border-dashed">
              <p className="text-muted-foreground">No courses found. Check back later!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
            <div className="bg-green-600 rounded-3xl p-8 lg:p-16 text-white text-center space-y-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
              
              <h2 className="text-4xl lg:text-5xl font-bold relative z-10">Ready to start learning?</h2>
              <p className="text-xl opacity-90 max-w-2xl mx-auto relative z-10">
                Start your tailoring journey today with expert guidance. Get access to professional stitching courses and master your craft.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="h-14 px-10 font-bold text-lg bg-white text-green-600 hover:bg-slate-100"
                  onClick={scrollToCourses}
                >
                  Get Started Now
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-14 px-10 font-bold text-lg bg-transparent border-white text-white hover:bg-white hover:text-green-600"
                  onClick={() => window.open('https://wa.me/918660888419', '_blank')}
                >
                  Contact Sales
                </Button>
              </div>
            </div>
        </div>
      </section>
    </div>
  );
}
