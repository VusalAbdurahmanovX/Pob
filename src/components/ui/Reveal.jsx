import { useInView } from '../../hooks/useInView.js';

export default function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...props }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'in' : ''} ${className}`}
      style={{ ...style, '--delay': `${delay}ms` }}
      {...props}
    >
      {children}
    </Tag>
  );
}
