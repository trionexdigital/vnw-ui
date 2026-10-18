/** A locale change changes presentation, never an inventory query or an unsaved form. */
export function contentQueryKey(params:URLSearchParams) {
  const content=new URLSearchParams(params);content.delete('lang');return content.toString();
}
