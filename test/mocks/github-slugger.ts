export default function createSlugger() {
  return {
    slug: (value: string) => value,
    reset: () => {
      /* noop */
    },
  };
}
