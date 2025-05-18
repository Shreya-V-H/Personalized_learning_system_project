import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Components/Home.jsx';
import SignIn from './Components/SignIn.jsx';
import Registration from './Components/Registration.jsx';
import Questionnaire from './Components/Questionnaire.jsx';
import Recommendation from './Components/Recommendation.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/SignIn" element={<SignIn />} />
      <Route path="/Registration" element={<Registration />} />
      <Route path="/Questionnaire" element={<Questionnaire />} />
      <Route path="/recommendations" element={<Recommendation />} /> {/* ✅ Updated */}
    </Routes>
  );
}

export default App;
