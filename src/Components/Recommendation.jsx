import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

// Trusted Channel IDs
const trustedChannelIds = [
  "UCeVMnSShP_Iviwkknt83cww", // CodeWithHarry
  "UCWv7vMbMWH4-V0ZXdmDpPBA", // ProgrammingWithMosh
  "UC8butISFwT-Wl7EV0hUK0BQ", // freeCodeCamp
  "UCxX9wt5FWQUAAz4UrysqK9A", // JennysLectures
  "UCVYamHliCI9rw1tHR1xbkfw", // ApnaCollege
  "UCQYMhOMi_Cdj1CEAU-fv80A", // NesoAcademy
  "UC4SVo0Ue36XCfOyb5Lh1viQ", // BroCode
  "UCzuaYxY3ULt0CGu41Z4UNPQ", // Babbar
  "UCYO_jab_esuFRV4b17AJtAw", // 3Blue1Brown
  "UCvjgXvBlbQiydffZU7m1_aw", // Fireship
  "UCsBjURrPoezykLs9EqgamOA", // The Net Ninja
  "UC29ju8bIPH5as8OGnQzwJyA", // Traversy Media
  "UCBwmMxybNva6P_5VmxjzwqA", // Academind
  "UC4xKdmAXFh4ACyhpiQ_3qBw", // Codevolution
];

const API_KEY = "";

function Recommendation() {
  const location = useLocation();

  const initialTopics = location.state?.selectedTopics || [];
  const skillLevel = location.state?.skillLevel || "Beginner";
  const contentType = location.state?.contentType || "Tutorials";
  const selectedLanguages = location.state?.selectedLanguages || [];

  const [selectedTopics, setSelectedTopics] = useState(initialTopics);
  const [videoData, setVideoData] = useState([]);

  const fetchVideos = async () => {
    const fetchedVideos = new Map();

    for (const topic of selectedTopics) {
      const baseQuery = `${topic} ${skillLevel} ${contentType}`;
      const extraLanguages = selectedLanguages.slice(0, 2);
      const allQueries = [baseQuery, ...extraLanguages.map(lang => `${topic} ${lang} ${contentType}`)];

      for (const query of allQueries) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query
        )}&type=video&maxResults=5&key=${API_KEY}`;

        try {
          const searchRes = await fetch(searchUrl);
          const searchData = await searchRes.json();

          if (searchData.items) {
            const videoIds = searchData.items.map(item => item.id.videoId).join(",");
            const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`;
            const detailsRes = await fetch(detailsUrl);
            const detailsData = await detailsRes.json();

            const filteredVideos = detailsData.items
              .filter(item =>
                item.statistics &&
                item.contentDetails &&
                trustedChannelIds.includes(item.snippet.channelId)
              )
              .sort((a, b) =>
                parseInt(b.statistics.viewCount || "0") - parseInt(a.statistics.viewCount || "0")
              )
              .slice(0, 3);

            filteredVideos.forEach(video => {
              if (!fetchedVideos.has(video.id)) {
                fetchedVideos.set(video.id, {
                  id: video.id,
                  title: video.snippet.title,
                  topic,
                  url: `https://www.youtube.com/watch?v=${video.id}`,
                  views: video.statistics.viewCount,
                  likes: video.statistics.likeCount,
                  duration: video.contentDetails.duration,
                });
              }
            });
          }
        } catch (error) {
          console.error("Error fetching video:", error);
        }
      }
    }

    setVideoData(Array.from(fetchedVideos.values()));
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
