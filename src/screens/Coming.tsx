export function Coming({ title, text }: { title: string; text: string }) {
  return (
    <div className="screen">
      <header>
        <h1>{title}</h1>
      </header>
      <div className="card empty">
        <h2>Not built yet</h2>
        <p style={{ marginBottom: 0 }}>{text}</p>
      </div>
    </div>
  );
}
