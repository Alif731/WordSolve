import { Outlet } from "react-router-dom";
import "../sass/style.scss";
// import "../sass/index.css";

const Main = () => {
  return (
    <main>
      <Outlet />
    </main>
  );
};

export default Main;
