import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Clock, Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  key?: string | number;
  status?: string;
  course: {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnail: string;
    instructorName: string;
    category: string;
    lessonsCount?: number;
    studentsCount?: number;
    rating?: number;
  };
}

export function CourseCard({ course, status }: CourseCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-muted/40 relative">
      {status && status !== 'approved' && (
        <div className="absolute top-2 right-2 z-20">
          <Badge 
            variant={status === 'pending' ? 'secondary' : 'destructive'} 
            className={cn(
              "backdrop-blur-sm",
              status === 'pending' ? "bg-yellow-500/80 text-white" : "bg-red-500/80 text-white"
            )}
          >
            {status === 'pending' ? 'Verification Pending' : 'Rejected'}
          </Badge>
        </div>
      )}
      <Link to={`/course/${course.id}`}>
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={course.thumbnail || 'https://picsum.photos/seed/course/800/450'} 
            alt={course.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {course.category}
            </Badge>
          </div>
        </div>
      </Link>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <Link to={`/course/${course.id}`} className="hover:text-primary transition-colors">
            <h3 className="font-bold text-lg leading-tight line-clamp-2">{course.title}</h3>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {course.description}
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{course.lessonsCount || 12} lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{course.studentsCount || 120} students</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span>{course.rating || 4.8}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
            {course.instructorName.charAt(0)}
          </div>
          <span className="text-xs font-medium">{course.instructorName}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="text-xl font-bold text-green-600">₹{course.price}</div>
        {status === 'approved' ? (
          <a 
            href={`https://wa.me/918660888419?text=Hi, I am enrolled in ${course.title}. Please send me the lessons.`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ size: "sm" }), "bg-green-600 hover:bg-green-700 text-white font-bold")}
          >
            WhatsApp
          </a>
        ) : status === 'pending' ? (
          <Link 
            to={`/course/${course.id}`} 
            className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "font-bold")}
          >
            Pending
          </Link>
        ) : (
          <Link 
            to={`/course/${course.id}`} 
            className={cn(buttonVariants({ size: "sm" }), "bg-green-600 hover:bg-green-700 text-white font-bold")}
          >
            Enroll Now
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
