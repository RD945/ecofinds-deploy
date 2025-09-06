import { Landing } from "./Landing";
import { Routes, Route } from "react-router-dom";

const Index = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
    </Routes>
  );
};

export default Index;
