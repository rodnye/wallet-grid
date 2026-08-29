import { useState } from 'preact/hooks';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <section id="center">
        <button
          type="button"
          class="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>
    </>
  );
}
