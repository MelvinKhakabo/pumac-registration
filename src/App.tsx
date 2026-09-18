import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Training from "./pages/Training";
import Competition from "./pages/Competition";
import OnlineCompetition from "./pages/OnlineCompetition";
import EarlyInterest from "./pages/EarlyInterest";

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/training" element={<Training />} />
        <Route path="/competition" element={<Competition />} />
        <Route path="/online-competition" element={<OnlineCompetition />} />
        <Route path="/2027" element={<EarlyInterest />} />
      </Routes>
      <Footer />
    </>
  );
}