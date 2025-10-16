import clsx from 'clsx'

export function Heading({ className, level = 1, ...props }) {
  let Element = `h${level}`

  return (
    <Element
      {...props}
      className={clsx(className, 'roboto-serif-heading text-2xl/8 text-zinc-950 sm:text-xl/8 dark:text-white')}
    />
  )
}

export function Subheading({ className, level = 2, ...props }) {
  let Element = `h${level}`

  return (
    <Element
      {...props}
      className={clsx(className, 'roboto-serif-heading text-base/7 text-zinc-950 sm:text-sm/6 dark:text-white')}
    />
  )
}
