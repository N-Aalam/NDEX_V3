const DiagramHistory = ({ items, onSelect }) => {
  if (!items?.length) {
    return <p className="small">No diagrams saved yet.</p>;
  }

  return (
    <ul className="list">
      {items.map((diagram) => (
        <li key={diagram.id}>
          <button className="link" type="button" onClick={() => onSelect(diagram.diagram_json)}>
            {diagram.type} — {new Date(diagram.created_at).toLocaleString()}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default DiagramHistory;
