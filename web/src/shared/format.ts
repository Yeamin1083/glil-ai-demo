export const bdt = (n: number) => `৳${n.toLocaleString('en-IN')}`

export const humanize = (code: string) =>
  code.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
