export function Spinner() {
  return <div className="spinner" role="status" aria-label="Loading" />;
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <h3>Something went wrong</h3>
      <p>{message}</p>
    </div>
  );
}
