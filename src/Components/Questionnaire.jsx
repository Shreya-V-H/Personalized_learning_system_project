import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './Questionnaire.css';

function Questionnaire() {
  const navigate = useNavigate();

  const [selectedTopics, setSelectedTopics] = useState([]);
  const [skillLevel, setSkillLevel] = useState('');
  const [contentType, setContentType] = useState('');
  const [languages, setLanguages] = useState([]);

  const topics = [
    'Web Development',
    'AI/ML',
    'Data Science',
    'Cyber Security',
    'Cloud Computing',
    'Mobile App Development',
    'DevOps',
    'Game Development',
  ];

  const programmingLanguages = [
    'Python',
    'JavaScript',
    'Java',
    'C++',
    'C#',
    'PHP',
    'TypeScript',
    'Kotlin',
    'Dart',
  ];

  const handleTopicChange = (e) => {
    const value = e.target.value;
    setSelectedTopics((prev) =>
      prev.includes(value)
        ? prev.filter((topic) => topic !== value)
        : [...prev, value]
    );
  };

  const handleLanguageChange = (e) => {
    const value = e.target.value;
    setLanguages((prev) =>
      prev.includes(value)
        ? prev.filter((lang) => lang !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedTopics.length === 0 || !skillLevel || !contentType) {
      alert('Please fill in all fields.');
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert('User not signed in!');
      return;
    }

    const data = {
      topics: selectedTopics,
      skillLevel,
      contentType,
      languages,
      timestamp: Timestamp.now(),
    };

    try {
      await setDoc(doc(db, 'userPreferences', user.uid), data); // 🔐 Save with UID
      console.log('Saved to Firestore:', data);

      // ⏩ Navigate to recommendations with state
      navigate('/recommendations', {
        state: {
          selectedTopics,
          skillLevel,
          contentType,
          selectedLanguages: languages,
        },
      });
    } catch (error) {
      console.error('Error saving preferences:', error.message);
      alert('Failed to save preferences. Try again.');
    }
  };

  return (
    <div className="container">
      <div className="questionnaire-card">
        <h3 className="text-center mb-4">Tell Us About Your Learning Preferences</h3>
        <form onSubmit={handleSubmit}>
          <strong>1. Interests:</strong>
          {topics.map((topic, index) => (
            <div className="form-check mb-2" key={index}>
              <input
                className="form-check-input"
                type="checkbox"
                value={topic}
                id={`topic-${index}`}
                onChange={handleTopicChange}
              />
              <label className="form-check-label" htmlFor={`topic-${index}`}>
                {topic}
              </label>
            </div>
          ))}

          <strong className="mt-3 d-block">2. Skill Level:</strong>
          {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
            <div className="form-check" key={level}>
              <input
                className="form-check-input"
                type="radio"
                name="skillLevel"
                value={level}
                onChange={(e) => setSkillLevel(e.target.value)}
                id={`skill-${level}`}
              />
              <label className="form-check-label" htmlFor={`skill-${level}`}>
                {level}
              </label>
            </div>
          ))}

          <strong className="mt-3 d-block">3. Preferred Content Type:</strong>
          {['Projects', 'Tutorials', 'Conceptual Videos'].map((type) => (
            <div className="form-check" key={type}>
              <input
                className="form-check-input"
                type="radio"
                name="contentType"
                value={type}
                onChange={(e) => setContentType(e.target.value)}
                id={`content-${type}`}
              />
              <label className="form-check-label" htmlFor={`content-${type}`}>
                {type}
              </label>
            </div>
          ))}

          <strong className="mt-3 d-block">4. Preferred Programming Languages:</strong>
          {programmingLanguages.map((lang, index) => (
            <div className="form-check mb-1" key={index}>
              <input
                className="form-check-input"
                type="checkbox"
                value={lang}
                id={`lang-${index}`}
                onChange={handleLanguageChange}
              />
              <label className="form-check-label" htmlFor={`lang-${index}`}>
                {lang}
              </label>
            </div>
          ))}

          <button type="submit" className="btn btn-primary w-100 mt-4">
            Get Recommendations
          </button>
        </form>
      </div>
    </div>
  );
}

export default Questionnaire;
