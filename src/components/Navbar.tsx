import { Link, useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, LayoutDashboard, Settings, Scissors } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { AuthModal } from './AuthModal';

export function Navbar() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogout = () => signOut(auth);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <Scissors className="w-6 h-6 text-green-600" />
          <span>Strictch Toppers</span>
        </Link>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (window.location.pathname === '/' || window.location.pathname === '/courses') {
                const element = document.getElementById('featured-courses');
                element?.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/');
                setTimeout(() => {
                  const element = document.getElementById('featured-courses');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="text-sm font-medium hover:text-primary transition-colors cursor-pointer"
          >
            Browse Courses
          </button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger 
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "relative h-8 w-8 rounded-full overflow-hidden"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                  <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem className="flex flex-col items-start cursor-default">
                  <div className="text-sm font-medium">{user.displayName}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                {user.email === 'somanianju46@gmail.com' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <AuthModal />
          )}
        </div>
      </div>
    </nav>
  );
}
