const CommitList = ({ commits }) => {
  if (!commits?.length) {
    return <p className="small">No commits loaded yet.</p>;
  }

  return (
    <ul className="list">
      {commits.map((commit) => (
        <li key={commit.sha}>
          <strong>{commit.author || "Unknown"}</strong> — {commit.message}
          <div className="small">{new Date(commit.date).toLocaleString()}</div>
        </li>
      ))}
    </ul>
  );
};

export default CommitList;
