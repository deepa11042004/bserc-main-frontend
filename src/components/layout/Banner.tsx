// components/HeroBanner/HeroBanner.tsx
import Link from 'next/link';
import { ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export interface HeroBannerProps {
  /** Main heading text */
  title: string;
  /** Background image URL (supports relative/absolute paths) */
  backgroundImage: string;
  /** Optional overlay color with opacity (default: rgba(0,0,0,0.5)) */
  overlayColor?: string;
  /** Height of the banner (default: 'h-[38vh]') */
  height?: string;
  /** Breadcrumb items for navigation */
  breadcrumbs: BreadcrumbItem[];
  /** Optional additional content below the title */
  children?: ReactNode;
  /** Optional custom classes for title */
  titleClassName?: string;
  /** Optional custom classes for container */
  containerClassName?: string;
  /** Animation class for entrance effects (default: 'animate-slideInDown') */
  animationClass?: string;
}

const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  backgroundImage,
  overlayColor = 'rgba(0,0,0,0.5)',
  height = 'h-[38vh]',
  breadcrumbs,
  children,
  titleClassName = '',
  containerClassName = '',
  animationClass = 'animate-slideInDown',
}) => {
  return (
    <div
      className={`w-full ${height} bg-cover bg-center relative flex flex-col items-center justify-center`}
      style={{
        backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), url('${backgroundImage}')`,
      }}
    >
      <div className="absolute inset-0" aria-hidden="true" />
      <div
        className={`relative container mx-auto text-center text-white px-4 ${containerClassName}`}
      >
        <h1
          className={`text-4xl md:text-6xl mb-4 ${animationClass} ${titleClassName}`}
        >
          {title}
        </h1>

        {breadcrumbs.length > 0 && (
          <nav aria-label="breadcrumb" className={animationClass}>
            <ol className="flex justify-center space-x-4 text-white pt-5">
              {breadcrumbs.map((item, index) => (
                <li key={index} className="flex items-center">
                  {item.href && !item.isActive ? (
                    <>
                      <Link
                        href={item.href}
                        prefetch={false}
                        className="hover:text-blue-400 transition-colors"
                      >
                        {item.label}
                      </Link>
                      {index < breadcrumbs.length - 1 && (
                        <span className="mx-4 text-white/70">/</span>
                      )}
                    </>
                  ) : (
                    <span
                      className={item.isActive ? 'text-blue-400 font-medium' : ''}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
};

export default HeroBanner;