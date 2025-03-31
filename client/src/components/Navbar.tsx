import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { logout } from "@/lib/firebase";
import AuthModal from "./AuthModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [location] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleOpenAuthModal = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "There was a problem logging you out",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <div className="text-primary font-bold text-xl flex items-center cursor-pointer">
                    <i className="fas fa-robot mr-2"></i>
                    StudyAI
                  </div>
                </Link>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link href="/">
                  <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location === "/" 
                      ? "border-primary text-gray-900" 
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}>
                    Home
                  </a>
                </Link>
                <Link href="/chat">
                  <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location === "/chat" 
                      ? "border-primary text-gray-900" 
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}>
                    Chat
                  </a>
                </Link>
                <Link href="/resources">
                  <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.includes("/resources") 
                      ? "border-primary text-gray-900" 
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}>
                    Resources
                  </a>
                </Link>
                <Link href="/engineering-cutoffs">
                  <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location === "/engineering-cutoffs" 
                      ? "border-primary text-gray-900" 
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}>
                    Engineering Cutoffs
                  </a>
                </Link>
                {currentUser?.email === "admin@example.com" || currentUser?.email === "parinp157@gmail.com" ? (
                  <Link href="/admin-dashboard">
                    <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location === "/admin-dashboard"
                        ? "border-primary text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}>
                      Admin Dashboard
                    </a>
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center">
              {!currentUser ? (
                <div className="flex space-x-4">
                  <Button
                    variant="ghost"
                    onClick={() => handleOpenAuthModal(true)}
                  >
                    Log in
                  </Button>
                  <Button onClick={() => handleOpenAuthModal(false)}>
                    Sign up
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer">
                      <AvatarImage src={currentUser.photoURL || undefined} />
                      <AvatarFallback>{currentUser.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem>Profile</DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="-mr-2 flex items-center md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              >
                <span className="sr-only">Open main menu</span>
                <i className="fas fa-bars h-6 w-6"></i>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${mobileMenuOpen ? "" : "hidden"}`}>
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/">
              <a className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                location === "/" 
                  ? "bg-primary-50 border-primary text-primary-700" 
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              }`}>
                Home
              </a>
            </Link>
            <Link href="/chat">
              <a className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                location === "/chat" 
                  ? "bg-primary-50 border-primary text-primary-700" 
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              }`}>
                Chat
              </a>
            </Link>
            <Link href="/resources">
              <a className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                location.includes("/resources") 
                  ? "bg-primary-50 border-primary text-primary-700" 
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              }`}>
                Resources
              </a>
            </Link>
            <Link href="/engineering-cutoffs">
              <a className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                location === "/engineering-cutoffs" 
                  ? "bg-primary-50 border-primary text-primary-700" 
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              }`}>
                Engineering Cutoffs
              </a>
            </Link>
            {currentUser?.email === "admin@example.com" || currentUser?.email === "parinp157@gmail.com" ? (
              <Link href="/admin-dashboard">
                <a className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  location === "/admin-dashboard"
                    ? "bg-primary-50 border-primary text-primary-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                }`}>
                  Admin Dashboard
                </a>
              </Link>
            ) : null}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {!currentUser ? (
              <div className="mt-3 space-y-1">
                <Button
                  variant="ghost"
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => handleOpenAuthModal(true)}
                >
                  Log in
                </Button>
                <Button
                  className="block w-full text-left px-4 py-2 text-base font-medium text-white bg-primary hover:bg-primary-700"
                  onClick={() => handleOpenAuthModal(false)}
                >
                  Sign up
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-1">
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Profile
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        isLogin={isLogin}
        setIsLogin={setIsLogin}
      />
    </>
  );
};

export default Navbar;