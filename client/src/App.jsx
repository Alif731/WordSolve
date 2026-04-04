import Main from "./components/Main";
import Footer from "./components/footer.jsx";
import Header from "./components/header.jsx";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <div className="app">
      <Header />
      <Main />
      <Footer />
      <ToastContainer
        position="top-right"
        autoClose={1400}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

export default App;
