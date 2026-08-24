'use client';

type GoogleMaterialIconProps = {
  name: string;
  className?: string;
  title?: string;
};

export function GoogleMaterialIcon({ name, className = '', title }: GoogleMaterialIconProps) {
  return (
    <span className={`material-symbols-rounded ${className}`} aria-hidden={title ? undefined : true} title={title}>
      {name}
    </span>
  );
}
