import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuthToken } from "../../../components/utils/auth";

const LeagueSettings = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const authToken = getAuthToken();

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const response = await fetch("/api/league/verify_commissioner", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          navigate("/unauthorized"); // Or back to dashboard
        } else {
          setAuthorized(true);
        }
      } catch (err) {
        console.error("Authorization check failed:", err);
        navigate("/unauthorized");
      }
    };

    verifyAccess();
  }, [code]);

  if (!authorized) return null; // or loading spinner

  return (
    <div className="mt-3">
      <h1>League Settings</h1>
      <p>You are authorized to manage this league.</p>
      {/* League settings content here */}
    </div>
  );
};

export default LeagueSettings;
