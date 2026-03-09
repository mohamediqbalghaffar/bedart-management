import React from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
      <div className="grid gap-1 w-full md:w-auto">
        <h1 className="font-bold text-2xl md:text-4xl font-headline leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm md:text-lg text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">{children}</div>}
    </div>
  );
}
