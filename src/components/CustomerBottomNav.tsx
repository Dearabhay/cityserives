import { Home, Search, CalendarDays, User, Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: CalendarDays, label: "Bookings", path: "/bookings" },
  { icon: Heart, label: "Favorites", path: "/favorites" },
  { icon: User, label: "Profile", path: "/profile" },
];

const CustomerBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-card border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>{item.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CustomerBottomNav;
