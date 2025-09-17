

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="text-sm mb-4" aria-label="Breadcrumb">
      <ol className="list-reset flex text-gray-500 dark:text-gray-300">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center">
            {item.href ? <a href={item.href} className="hover:underline text-primary">{item.label}</a> : <span>{item.label}</span>}
            {idx < items.length - 1 && <span className="mx-2">/</span>}
          </li> 
        ))}
      </ol>
    </nav>
  );
}
