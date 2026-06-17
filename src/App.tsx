import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Timeline } from "@/pages/Timeline";
import { Snapshots } from "@/pages/Snapshots";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/snapshots" element={<Snapshots />} />
        </Routes>
      </Layout>
    </Router>
  );
}
