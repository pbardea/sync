"use client";

import { Calendar, CheckSquare, Plane, Dumbbell, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export function SideNavigation() {
    return (
        <nav className="flex flex-col w-64 h-screen bg-gray-50 text-gray-800">
            <div className="p-4">
                <h1 className="text-2xl font-bold">Menu</h1>
            </div>
            <ul className="flex-1 px-2">
                <NavItem
                    href="/calendar"
                    icon={<Calendar size={20} />}
                    label="Calendar"
                />
                <NavItem
                    href="/chores"
                    icon={<CheckSquare size={20} />}
                    label="Chores"
                />
                <NavItem href="/trips" icon={<Plane size={20} />} label="Trips" />
                <NavItem
                    href="/fitness"
                    icon={<Dumbbell size={20} />}
                    label="Fitness"
                />
                <NavItem
                    href="/documents"
                    icon={<FileText size={20} />}
                    label="Documents"
                />
            </ul>
        </nav>
    );
}

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
