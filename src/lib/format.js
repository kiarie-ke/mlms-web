export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
export const fmtDateTime = (d) => !d ? "—" : new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
export const kes = (n) => `KES ${Number(n).toLocaleString()}`;
export const errMsg = (e) => e?.message || 'Something went wrong';
