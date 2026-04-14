import { Outlet } from "react-router-dom";
import CustomerBottomNav from "@/components/CustomerBottomNav";

const CustomerLayout = () => {
  return (
    <>
      <Outlet />
      <CustomerBottomNav />
    </>
  );
};

export default CustomerLayout;
