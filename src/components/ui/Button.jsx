import styles from './Button.module.css';

export default function Button({ variant = 'primary', size = 'md', href, className = '', children, ...props }) {
  const classes = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`;
  if (href) return <a className={classes} href={href} {...props}>{children}</a>;
  return <button type="button" className={classes} {...props}>{children}</button>;
}
