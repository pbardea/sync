import {
  Calendar,
  CheckSquare,
  Plane,
  Dumbbell,
  FileText,
  Home as HomeIcon,
  HeartPulse,
  SettingsIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { observer } from "mobx-react";
import { useContext } from "react";
import { PoolContext } from "@/main";
import { Home } from "@/models/home";


export const SideNavigation = observer(() => {
    const pool = useContext(PoolContext)
    const home = (pool.getRoot as Home)
  return (
    <nav className="flex flex-col w-64 h-screen bg-gray-50 text-gray-800">
      <div className="p-4">
        <h1 className="text-2xl font-bold">{home?.name ?? "Home base"}</h1>
      </div>
      <ul className="flex-1 px-2">
        <NavItem href="/" icon={<HomeIcon size={20} />} label="Home" />
        <NavItem
          href="/chores"
          icon={<CheckSquare size={20} />}
          label="Chores" // Should this be called TODOs?
        />
        <NavItem
          href="/fitness"
          icon={<Dumbbell size={20} />}
          label="Fitness"
        />
        <NavItem
          href="/health"
          icon={<HeartPulse size={20} />}
          label="Health"
        />
        <NavItem href="/trips" icon={<Plane size={20} />} label="Trips" />
        <NavItem
          href="/calendar"
          icon={<Calendar size={20} />}
          label="Calendar"
        />
        <NavItem
          href="/documents"
          icon={<FileText size={20} />}
          label="Documents"
        />
        <NavItem href="/settings" icon={<SettingsIcon size={20} />} label="Settings" />
      </ul>
    </nav>
  );
});

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li>
      <Link
        to={href}
        className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150 ease-in-out"
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
}
