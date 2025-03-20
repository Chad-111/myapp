import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const apiUrl = window.location.origin + "/api/";

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error("Error fetching:", error));
  }, []);

  return (
    <div>
      <h1>React Frontend</h1>
      <p>API Response: {message}</p>
    </div>
  );
}

export default App;
