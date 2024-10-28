import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  to: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
}

export const PageHeader = ({ title, breadcrumbs }: PageHeaderProps) => {
  return (
    <>
      <h1 className="text-4xl font-bold mb-2">{title}</h1>
      <nav aria-label="Breadcrumb" className="max-w-lg">
        <ol className="flex items-center text-gray-500 text-sm">
          {breadcrumbs.map((item, index) => (
            <li key={item.to} className="flex items-center">
              <Link
                to={item.to}
                className="hover:text-gray-700 border-b border-gray-300 pb-1"
              >
                {item.label}
              </Link>
              {index < breadcrumbs.length - 1 && (
                <span className="mx-2 text-gray-400">/</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};
