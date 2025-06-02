import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { auth, db } from "../firebase"; 
import { doc, getDoc } from "firebase/firestore";

const API_KEY = "AIzaSyDy3jZKh0dgsAZ_YFms_FiE-rcbmI8UILk";

function Recommendation() {
  const location = useLocation();

 
  const initialTopics = location.state?.selectedTopics || [];
  const skillLevel = location.state?.skillLevel || "Beginner";
  const contentType = location.state?.contentType || "Tutorials";
  const selectedLanguages = location.state?.selectedLanguages || [];

 
  const [selectedTopics, setSelectedTopics] = useState(initialTopics);
  const [videoData, setVideoData] = useState([]);

  const fetchVideos = async () => {
    const fetchedVideos = [];

    for (const topic of selectedTopics) {
      const baseQuery = `${topic} ${skillLevel} ${contentType}`;
      

      const allQueries = [baseQuery, ...selectedLanguages.map(lang => `${topic} ${lang} ${contentType}`)];

      for (const query of allQueries) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query
        )}&type=video&maxResults=3&key=${API_KEY}`;

        try {
          const searchRes = await fetch(searchUrl);
          const searchData = await searchRes.json();

          if (searchData.items) {
            const videoIds = searchData.items.map(item => item.id.videoId).join(",");
            const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`;
            const detailsRes = await fetch(detailsUrl);
            const detailsData = await detailsRes.json();

            const sorted = detailsData.items
              .filter(item => item.statistics && item.contentDetails)
              .sort((a, b) => parseInt(b.statistics.viewCount || "0") - parseInt(a.statistics.viewCount || "0"));

            const topThree = sorted.slice(0, 3);

            topThree.forEach((video) => {
              fetchedVideos.push({
                id: video.id,
                title: video.snippet.title,
                topic: topic,
                url: `https://www.youtube.com/watch?v=${video.id}`,
                views: video.statistics.viewCount,
                likes: video.statistics.likeCount,
                duration: video.contentDetails.duration,
              });
            });
          }
        } catch (error) {
          console.error("Error fetching video:", error);
        }
      }
    }

    setVideoData(fetchedVideos);
  };

  useEffect(() => {
    const fetchPreferencesAndVideos = async () => {
      if (selectedTopics.length > 0) {
        fetchVideos();
      } else {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        try {
          const docSnap = await getDoc(doc(db, "userPreferences", uid));
          if (docSnap.exists()) {
            const prefs = docSnap.data();
            const allTopics = [...prefs.interests, ...prefs.languages];
            setSelectedTopics(allTopics);
          }
        } catch (error) {
          console.error("Error fetching preferences from Firestore:", error);
        }
      }
    };

    fetchPreferencesAndVideos();
  }, [selectedTopics]);

  const convertToEmbedUrl = (url) => {
    const match = url.match(/(?:https?:\/\/(?:www\.)?youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  const groupVideosByTopic = (videos) => {
    const grouped = {};
    videos.forEach((video) => {
      if (!grouped[video.topic]) {
        grouped[video.topic] = [];
      }
      grouped[video.topic].push(video);
    });
    return grouped;
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Recommended Videos</h1>

      {Object.entries(groupVideosByTopic(videoData)).map(([topic, videos]) => (
        <div key={topic} style={{ marginBottom: "40px" }}>
          <h2 style={{ marginBottom: "15px", color: "#333" }}>{topic}</h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "25px",
              justifyContent: "flex-start",
            }}
          >
            {videos.map((video) => (
              <div
                key={video.id}
                style={{
                  width: "500px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "8px",
                  padding: "15px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <h3 style={{ fontSize: "16px", textAlign: "center" }}>{video.title}</h3>
                <iframe
                  width="100%"
                  height="220"
                  src={convertToEmbedUrl(video.url)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={video.title}
                  style={{ borderRadius: "6px", marginTop: "10px" }}
                ></iframe>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Recommendation;
