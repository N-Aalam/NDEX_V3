const RepoTree = ({ entries }) => {
  if (!entries?.length) {
    return <p className="small">No repository data yet.</p>;
  }

  const tree = {};
  entries.forEach((entry) => {
    const parts = entry.path.split("/");
    let cursor = tree;
    parts.forEach((part, index) => {
      if (!cursor[part]) {
        cursor[part] = { __children: {}, __type: index === parts.length - 1 ? entry.type : "tree" };
      }
      cursor = cursor[part].__children;
    });
  });

  const renderNode = (node) => (
    <ul className="list">
      {Object.entries(node).map(([name, value]) => (
        <li key={name}>
          {value.__type === "tree" ? "📁" : "📄"} {name}
          {Object.keys(value.__children).length > 0 && renderNode(value.__children)}
        </li>
      ))}
    </ul>
  );

  return renderNode(tree);
};

export default RepoTree;
