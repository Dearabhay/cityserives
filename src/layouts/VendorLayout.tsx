import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarCheck, Wrench, User, HeadphonesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/vendor" },
  { icon: CalendarCheck, label: "Bookings", path: "/vendor/bookings" },
  { icon: Wrench, label: "Services", path: "/vendor/services" },
  { icon: HeadphonesIcon, label: "Support", path: "/vendor/support" },
  { icon: User, label: "Profile", path: "/vendor/profile" },
];

const VendorLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[60px]",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default VendorLayout;
