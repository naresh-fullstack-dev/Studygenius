import { Link, useLocation } from "wouter";
import { Upload, HelpCircle, MessageCircle, StickyNote, GraduationCap, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "upload", label: "Upload PDF", icon: Upload, path: "/" },
  { id: "generate", label: "Generate Questions", icon: HelpCircle, path: "/generate" },
  { id: "chat", label: "Tutor Chat", icon: MessageCircle, path: "/chat" },
  { id: "notes", label: "Study Notes", icon: StickyNote, path: "/notes" },
];

export function Navigation() {
  const [location] = useLocation();

  const getActiveTab = () => {
    if (location === "/" || location === "/upload") return "upload";
    if (location === "/generate") return "generate";
    if (location === "/chat") return "chat";
    if (location === "/notes") return "notes";
    return "upload";
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-gray-900">EduAI</span>
            </div>
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = getActiveTab() === item.id;
                return (
                  <Link key={item.id} href={item.path}>
                    <button
                      data-testid={`nav-${item.id}`}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2",
                        isActive ? "nav-tab-active" : "nav-tab-inactive"
                      )}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="text-gray-400" size={20} />
            </div>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="text-gray-600" size={16} />
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      <div className="md:hidden border-t border-gray-200 bg-white">
        <div className="px-4 pb-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = getActiveTab() === item.id;
            return (
              <Link key={item.id} href={item.path}>
                <button
                  data-testid={`mobile-nav-${item.id}`}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2",
                    isActive ? "nav-tab-active" : "nav-tab-inactive"
                  )}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
